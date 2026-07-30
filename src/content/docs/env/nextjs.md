---
title: Next.js
description: Wire generated Env targets and browser projections into Next.js App Router or Pages Router applications.
---

Next.js integration is application-owned wiring around generated Env modules. There is no `@astilba/env/next` export and no framework-specific configuration semantics.

Use a generated server target wherever Next.js runs server code. When the browser needs deployment configuration, expose the public target through an inert JSON route and validate it with `@astilba/env/browser`.

Env 0.2 has package-consumer evidence for Next.js 15.5.22 and 16.2.12 across App Router static, App Router request, Pages Router static, and Pages Router request modes. The server side of that evidence uses the Node.js runtime.

This page does not claim support for Next.js Edge Runtime or a Next.js deployment on Cloudflare Workers. The separate [Cloudflare Workers](/docs/env/cloudflare-workers/) boundary admits only the documented direct Worker-handler path.

## Generate framework-neutral modules

Declare separate browser and server consumers:

```ts
import { defineEnvironment, env } from "@astilba/env";

export default defineEnvironment({
  id: "com.example.web",
  entries: {
    apiOrigin: env.public.deployment.origin(),
    applicationOrigin: env.public.deployment.origin(),
    databaseUrl: env.private.deployment.secret(),
  },
  consumers: {
    browser: env.browser(["apiOrigin", "applicationOrigin"]),
    server: env.server(["databaseUrl"]),
  },
  targets: {
    browserDeployment: env.process("browser", {
      apiOrigin: "API_ORIGIN",
      applicationOrigin: "APPLICATION_ORIGIN",
    }),
    serverDeployment: env.process("server", {
      databaseUrl: "DATABASE_URL",
    }),
  },
});
```

Generate and check the application-owned modules:

```sh
pnpm exec astilba-env generate
pnpm exec astilba-env generate --check
```

The browser target creates:

- `.astilba/env/browserDeployment.server.ts`, which checks the application source; and
- `.astilba/env/browser/browser.deployment.ts`, which contains the public projection and decoder without values.

## Load private configuration on the server

Import a generated server target only from server-owned code:

```ts
import "server-only";

import { load } from "../.astilba/env/serverDeployment.server";

export const configuration = load(process.env);
```

Use `check(process.env)` instead when a route or startup boundary needs to choose its own failure response. Never pass the resulting private configuration through props to a Client Component.

## Add an App Router endpoint

Return the exact public envelope from a dynamic route:

```ts
// app/api/env/route.ts
import { BOOTSTRAP_PROTOCOL } from "@astilba/env/browser";
import { NextResponse } from "next/server";

import { projection } from "../../../.astilba/env/browser/browser.deployment";
import { check } from "../../../.astilba/env/browserDeployment.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = (): NextResponse => {
  const result = check(process.env);

  if (!result.ok) {
    return NextResponse.json(
      { diagnostics: result.diagnostics, ok: false },
      {
        headers: { "Cache-Control": "private, no-store" },
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      audience: { origin: result.value.applicationOrigin },
      consumer: projection.consumer,
      contract: projection.contract,
      lifecycle: projection.lifecycle,
      projection: projection.digest,
      protocol: BOOTSTRAP_PROTOCOL,
      values: result.value,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
};
```

`APPLICATION_ORIGIN` must be the trusted canonical origin that serves both the page and endpoint. Do not derive it directly from an untrusted `Host` or forwarded header.

## Add a Pages Router endpoint

The Pages Router uses the same generated modules and envelope. Keep its API handler on the Node.js runtime, not the Edge Runtime:

```ts
// pages/api/env.ts
import { BOOTSTRAP_PROTOCOL } from "@astilba/env/browser";
import type { NextApiRequest, NextApiResponse } from "next";

import { projection } from "../../.astilba/env/browser/browser.deployment";
import { check } from "../../.astilba/env/browserDeployment.server";

export default function handler(
  _request: NextApiRequest,
  response: NextApiResponse
): void {
  const result = check(process.env);

  response.setHeader("Cache-Control", "private, no-store");

  if (!result.ok) {
    response.status(500).json({
      diagnostics: result.diagnostics,
      ok: false,
    });
    return;
  }

  response.status(200).json({
    audience: { origin: result.value.applicationOrigin },
    consumer: projection.consumer,
    contract: projection.contract,
    lifecycle: projection.lifecycle,
    projection: projection.digest,
    protocol: BOOTSTRAP_PROTOCOL,
    values: result.value,
  });
}
```

Both response helpers produce the required JSON content type. The Env browser loader also requests with `cache: "no-store"` and refuses redirects.

## Load before rendering dependent UI

Create a Client Component that owns loading, success, and failure:

```tsx
// environment-client.tsx
"use client";

import { loadBrowserBootstrap } from "@astilba/env/browser";
import { createContext, useEffect, useState } from "react";

import {
  type Configuration,
  projection,
} from "./.astilba/env/browser/browser.deployment";

export const EnvironmentContext = createContext<
  Readonly<Configuration> | undefined
>(undefined);

type EnvironmentState =
  | { status: "loading" }
  | { status: "ready"; values: Readonly<Configuration> }
  | { status: "error" };

export function EnvironmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<EnvironmentState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;

    void loadBrowserBootstrap({
      endpoint: "/api/env",
      expectedAudience: { origin: window.location.origin },
      fetch: globalThis.fetch,
      projection,
      requestBaseUrl: window.location.href,
    }).then(
      ({ values }) => {
        if (active) {
          setState({ status: "ready", values });
        }
      },
      () => {
        if (active) {
          setState({ status: "error" });
        }
      }
    );

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <p aria-live="polite" role="status">
        Loading configuration.
      </p>
    );
  }

  if (state.status === "error") {
    return <p role="alert">Configuration is unavailable.</p>;
  }

  return (
    <EnvironmentContext.Provider value={state.values}>
      {children}
    </EnvironmentContext.Provider>
  );
}
```

Mount the provider in `app/layout.tsx` or `pages/_app.tsx`. Keep dependent children out of the tree until validation succeeds, and replace the sample status text with application-specific UI.

## Choose build or deployment values

Use a public `build` entry when a browser value may be fixed during `next build`. Import its generated `.build.ts` module directly.

Use a public `deployment` entry and the JSON route when one built Next.js artifact must observe different values across deployments. The application owns the route, canonical origin, caching, authentication, and failure UI.

Read [Deliver browser configuration](/docs/env/browser-delivery/) for the complete protocol boundary. If you are replacing `DynamicEnvScript`, `clientEnv`, or `serverEnv`, continue with [Migrate from next-dynamic-env](/docs/env/migrate-from-next-dynamic-env/).

---
title: Migrate from next-dynamic-env
description: Replace next-dynamic-env proxies and script injection with an explicit Env declaration, generated modules, and application-owned JSON delivery.
---

Astilba Env covers the build-once deployment use case of [`next-dynamic-env`](https://github.com/ReesMorris/next-dynamic-env), but it does not preserve that package's API or runtime mechanism. The migration replaces ambient proxies and script injection with an explicit contract, generated browser and server modules, and an application-owned inert JSON endpoint.

Treat this as an architectural migration, not a package rename.

## Map the concepts

| `next-dynamic-env` | Astilba Env 0.1 |
| --- | --- |
| `createDynamicEnv({ client, server })` | [`defineEnvironment({ entries, consumers, targets })`](/docs/env/declaration-reference/#defineenvironment) |
| `clientEnv` proxy | Generated browser build configuration or validated bootstrap values |
| `serverEnv` proxy | Generated server target `check` or `load` |
| `DynamicEnvScript` | Application-owned JSON endpoint plus `loadBrowserBootstrap` |
| `waitForEnv` | Await `loadBrowserBootstrap` or use `startBrowserApplication` |
| Inline `window.__NEXT_DYNAMIC_ENV__` value | Inert, same-origin JSON response |
| Validator tuple beside each current value | Lifecycle-aware codec in the declaration |
| Automatic validation skip during `next build` | Explicit build, deployment, and request lifecycles |
| `emptyStringAsUndefined` global option | Per-codec blank, required, and normalisation policy |
| Framework package with one root export | Framework-neutral root, browser, runtime, and Vite boundaries |

There is no `@astilba/env/next` export. App Router and Pages Router integrations use application code around the same generated modules.

## Replace the runtime declaration

A `next-dynamic-env` declaration reads current values while it constructs `clientEnv` and `serverEnv`. An Env declaration describes values without reading them:

```ts
// astilba.env.ts
import { defineEnvironment, env } from "@astilba/env";

export default defineEnvironment({
  id: "com.example.web",
  entries: {
    apiOrigin: env.public.deployment.origin(),
    applicationOrigin: env.public.deployment.origin(),
    databaseUrl: env.private.deployment.secret(),
    port: env.private.deployment.safeInteger({
      maximum: 65_535,
      minimum: 1,
    }),
  },
  consumers: {
    browser: env.browser(["apiOrigin", "applicationOrigin"]),
    server: env.server(["databaseUrl", "port"]),
  },
  targets: {
    browserDeployment: env.process("browser", {
      apiOrigin: "API_ORIGIN",
      applicationOrigin: "APPLICATION_ORIGIN",
    }),
    serverDeployment: env.process("server", {
      databaseUrl: "DATABASE_URL",
      port: "PORT",
    }),
  },
});
```

Public exposure is determined by both the entry visibility and the browser consumer selection. A variable name does not become public merely because it has a `NEXT_PUBLIC_` prefix.

Generate the application-owned interfaces:

```sh
astilba-env generate
```

Check generated drift in CI:

```sh
astilba-env generate --check
```

This declaration generates:

```text
.astilba/env/browser/browser.deployment.ts
.astilba/env/browserDeployment.server.ts
.astilba/env/serverDeployment.server.ts
```

The browser module exports `projection`; it contains a public decoder and compatibility identity, not values. Each server target exports typed `check(source)` and `load(source)` operations for its selected lifecycle.

## Load server configuration explicitly

Replace `serverEnv` property access with a generated target import:

```ts
import { load } from "./.astilba/env/serverDeployment.server";

const configuration = load(process.env);

configuration.databaseUrl;
configuration.port;
```

Use `check` where the application needs to choose its failure response:

```ts
import { check } from "./.astilba/env/serverDeployment.server";

const result = check(process.env);

if (!result.ok) {
  console.error(result.diagnostics);
  process.exitCode = 1;
} else {
  startServer(result.value);
}
```

Diagnostics contain stable codes and entry identities where appropriate; they do not echo configuration values.

## Add the application-owned browser endpoint

Replace `DynamicEnvScript` with a route that returns the exact public target as JSON. The envelope carries the generated projection identity so the browser can refuse a stale, cross-origin, or incorrectly shaped response.

The endpoint is application code. Env does not choose its path, authentication, trusted origin source, or deployment policy.

### App Router route

```ts
// app/api/env/route.ts
import { NextResponse } from "next/server";

import { projection } from "../../../.astilba/env/browser/browser.deployment";
import { check } from "../../../.astilba/env/browserDeployment.server";

export const dynamic = "force-dynamic";

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
      protocol: "astilba.env.bootstrap/v1",
      values: result.value,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
};
```

`APPLICATION_ORIGIN` must be the canonical origin that serves the page and endpoint. If your platform derives that origin from forwarded headers, perform that derivation only at a trusted proxy boundary.

### Pages Router route

```ts
// pages/api/env.ts
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
    protocol: "astilba.env.bootstrap/v1",
    values: result.value,
  });
}
```

`NextResponse.json` and `response.json` produce the required JSON content type. Responses that can vary by request must include `Cache-Control: private, no-store`; the Env browser loader also fetches with `cache: "no-store"` and `redirect: "error"`.

## Load browser configuration before use

Replace the `clientEnv` proxy with values returned by `loadBrowserBootstrap`:

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

export const EnvironmentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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
    return (
      <p role="alert">
        Configuration is unavailable. Refresh to try again.
      </p>
    );
  }

  return (
    <EnvironmentContext.Provider value={state.values}>
      {children}
    </EnvironmentContext.Provider>
  );
};
```

Replace the sample pending and failure text with application-specific UI. Keep both states perceivable, and do not render application children until the bootstrap has validated successfully.

Mount the provider in either router:

```tsx
// app/layout.tsx
import { EnvironmentProvider } from "../environment-client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <EnvironmentProvider>{children}</EnvironmentProvider>
      </body>
    </html>
  );
}
```

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";

import { EnvironmentProvider } from "../environment-client";

export default function Application({
  Component,
  pageProps,
}: AppProps) {
  return (
    <EnvironmentProvider>
      <Component {...pageProps} />
    </EnvironmentProvider>
  );
}
```

For a browser entry point that must not import application code until validation succeeds, use `startBrowserApplication`. Public build values do not need an endpoint; import `configuration` from `.astilba/env/browser/<consumer>.build.ts`.

## Understand the validation differences

| Behavior | Migration decision |
| --- | --- |
| Validation ran while `createDynamicEnv` built its proxies | Env checks a generated target when your code calls `check` or `load`. |
| Validation was automatically skipped during `next build` | Mark values as `build`, `deployment`, or `request`; resolve each at that lifecycle. There is no automatic Next build bypass. |
| Raw values could be accepted without a schema | Choose an explicit [Env codec](/docs/env/declaration-reference/#built-in-codecs). |
| One global option converted empty strings to missing values | Configure blank and required behavior on each codec. |
| Validator transforms supplied defaults or arbitrary output types | Use a built-in codec, a private opaque schema, or application validation after loading. |
| Validation errors could throw, warn, or call a handler | Use `check` for an explicit result or `load` for an exception. |
| Client and server values lived behind runtime proxies | Generated browser and server modules create a static import boundary. |

The browser projection accepts only Env's portable public codecs. Arbitrary schemas and opaque transforms cannot cross into a browser consumer.

## Migrate Yup validation

Choose one of three paths for existing Yup schemas.

### Prefer built-in codecs

Translate common constraints directly:

```ts
entries: {
  enabled: env.public.deployment.boolean(),
  mode: env.public.deployment.enum(["standard", "compact"]),
  origin: env.public.deployment.origin(),
  port: env.private.deployment.safeInteger({
    maximum: 65_535,
    minimum: 1,
  }),
}
```

This keeps the contract portable and lets generation produce the exact browser and server decoders.

### Keep a custom private schema

For a genuinely custom private transform, declare an `opaque` entry with a value-free input and output shape:

```ts
serviceOptions: env.private.deployment.opaque({
  input: { kind: "string" },
  output: {
    kind: "object",
    properties: [
      {
        name: "region",
        required: true,
        shape: { kind: "string" },
      },
    ],
  },
  revision: "1",
  semantics: "com.example.service-options/v1",
}),
```

Add `serviceOptions` to the `server` consumer selection and bind it in `serverDeployment`:

```ts
consumers: {
  server: env.server(["databaseUrl", "port", "serviceOptions"]),
},
targets: {
  serverDeployment: env.process("server", {
    databaseUrl: "DATABASE_URL",
    port: "PORT",
    serviceOptions: "SERVICE_OPTIONS",
  }),
},
```

Then pass an exactly typed, synchronous Standard Schema v1 validator to the generated target. If your Yup version does not expose compatible Standard Schema input and output types directly, wrap `validateSync`:

```ts
import type { StandardSchemaV1 } from "@astilba/env/runtime";
import * as yup from "yup";

import { load } from "./.astilba/env/serverDeployment.server";

type ServiceOptions = Readonly<{ region: string }>;

const yupOptions = yup
  .object({ region: yup.string().required() })
  .required();

const serviceOptions: StandardSchemaV1<string, ServiceOptions> = {
  "~standard": {
    validate(input) {
      try {
        return {
          value: yupOptions.validateSync(JSON.parse(input)),
        };
      } catch {
        return {
          issues: [{ message: "Invalid service options." }],
        };
      }
    },
    vendor: "yup",
    version: 1,
  },
};

const configuration = await load(process.env, { serviceOptions });
```

Opaque entries are private server values only. Async Standard Schema validation is not supported in 0.1.

### Validate after loading

If the Yup schema belongs to application business rules rather than the portable configuration contract, load a private `text` or `secret` entry and validate it in application code. Env still owns presence, exposure, lifecycle, and redacted configuration diagnostics; your application owns the additional semantic validation.

## Account for intentional non-compatibilities

Env 0.1 does not provide compatibility exports or shims for:

- `createDynamicEnv`;
- `clientEnv` or `serverEnv`;
- `DynamicEnvScript`;
- `waitForEnv`;
- `window.__NEXT_DYNAMIC_ENV__`;
- `__raw`;
- `skipValidation` or automatic build-phase detection;
- `onValidationError`;
- a global `emptyStringAsUndefined` switch;
- implicit `NEXT_PUBLIC_*` exposure; or
- `@astilba/env/next`.

Do not keep both browser delivery mechanisms active. Remove `DynamicEnvScript` and `waitForEnv` after the JSON bootstrap path is working, then remove `next-dynamic-env` from the application.

## Verify the migration

Before removing the old package:

1. run `astilba-env generate --check` in CI;
2. fail application startup or the endpoint when a required deployment value is missing;
3. verify browser bundles contain no private entry name, binding name, or value;
4. verify the JSON response has the expected same-origin audience and `Cache-Control: private, no-store`;
5. change deployment values without rebuilding and confirm one built artifact observes the new values;
6. exercise both successful and rejected bootstrap responses; and
7. remove every import and global reference from `next-dynamic-env`.

The 0.1 package tests cover App Router and Pages Router builds in static and request modes. That evidence verifies the generated-module boundary; your route, proxy trust, startup policy, and failure UI still require application tests.

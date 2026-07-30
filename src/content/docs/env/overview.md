---
title: Overview
description: Understand Astilba Env's lifecycle model, generated modules, browser delivery, and responsibility boundary.
---

Astilba Env turns one portable TypeScript declaration into generated configuration interfaces for the artifacts that consume them. It keeps browser and server projections physically separate, distinguishes build, deployment, and request values, and validates values at the lifecycle where they become available.

The 0.1 release is a public alpha. Use it when explicit configuration boundaries are worth adopting before the API reaches stability.

## Decide whether Env fits

| You want to… | Fit |
| --- | --- |
| Promote one built artifact through several deployments | Declare deployment values and resolve them when the application starts or serves them. |
| Keep private names and bindings out of browser bundles | Browser consumers receive generated public projections only. |
| Validate build, deployment, and request values separately | Each entry declares its lifecycle and each generated target resolves one lifecycle. |
| Run without an Astilba service | Generation, checking, and planning are local; the application owns value storage and delivery. |
| Inject arbitrary configuration through inline JavaScript | Not supported. Browser deployment and request values use inert, same-origin JSON. |
| Import one mutable environment object everywhere | Not supported. Generated modules create explicit artifact boundaries. |
| Keep framework-specific runtime semantics | Env supplies portable modules; your framework owns routing and application startup. |

## Declare consumers and targets

Create `astilba.env.ts` in an ESM package:

```ts
import { defineEnvironment, env } from "@astilba/env";

export default defineEnvironment({
  id: "com.example.application",
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
      apiOrigin: "PUBLIC_API_ORIGIN",
      applicationOrigin: "APPLICATION_ORIGIN",
    }),
    serverDeployment: env.process("server", {
      databaseUrl: "DATABASE_URL",
    }),
  },
});
```

The entry builder fixes three decisions in the contract:

- visibility: `public` or `private`;
- lifecycle: `build`, `deployment`, or `request`; and
- codec: the exact accepted input and typed output.

A consumer selects the entries one artifact may know. A target maps one consumer and lifecycle to names in an application-owned source record such as `process.env`.

## Generate typed modules

Run generation locally and check drift in CI:

```sh
astilba-env generate
astilba-env generate --check
```

For the declaration above, the application imports these generated modules:

```text
.astilba/env/browser/browser.deployment.ts
.astilba/env/browserDeployment.server.ts
.astilba/env/serverDeployment.server.ts
```

The generated server target modules export typed `check(source)` and `load(source)` functions. `check` returns either a typed value or redacted diagnostics. `load` returns the value or throws an environment-configuration error.

```ts
import { load } from "./.astilba/env/serverDeployment.server";

const configuration = load(process.env);
configuration.databaseUrl;
```

The generated browser module exports a `projection`. It contains the public decoder and compatibility identity for one consumer and lifecycle. It contains no values, private entry names, private bindings, or complete contract metadata.

## Deliver browser values as inert JSON

Your application owns the JSON endpoint. It resolves the public target, constructs the envelope, and returns only the selected public values:

```ts
import { projection } from "./.astilba/env/browser/browser.deployment";
import { check } from "./.astilba/env/browserDeployment.server";

export const environmentResponse = (): Response => {
  const result = check(process.env);

  if (!result.ok) {
    return Response.json(
      { diagnostics: result.diagnostics, ok: false },
      {
        headers: { "Cache-Control": "private, no-store" },
        status: 500,
      }
    );
  }

  return Response.json(
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

Load and validate that envelope before the browser application consumes it:

```ts
import { loadBrowserBootstrap } from "@astilba/env/browser";
import { projection } from "./.astilba/env/browser/browser.deployment";

const bootstrap = await loadBrowserBootstrap({
  endpoint: "/api/env",
  expectedAudience: { origin: window.location.origin },
  fetch: globalThis.fetch,
  projection,
  requestBaseUrl: window.location.href,
});

bootstrap.values.apiOrigin;
```

The browser runtime fetches with `cache: "no-store"` and refuses redirects, cross-origin responses, unexpected content types, incompatible protocol or projection identities, oversized payloads, unknown fields, and invalid typed values.

Responses that can vary by request must use `Cache-Control: private, no-store`. Static public build values use a generated `.build.ts` module instead of a runtime endpoint.

## Keep ownership explicit

Env owns:

- contract compilation and deterministic generated output;
- public and server projection separation;
- process-source checking and redacted diagnostics;
- browser envelope validation; and
- value-free compatibility planning.

Your application owns:

- the environment variables, secret manager, or platform bindings;
- when generated targets are checked or loaded;
- the browser endpoint and its trusted canonical origin;
- response headers and authentication where request values require it; and
- framework startup and failure presentation.

Continue with [Configure a Node application](/docs/env/quickstart/) for the smallest working setup, [Deliver browser configuration](/docs/env/browser-delivery/) for the complete bootstrap boundary, or [Release and support](/docs/env/release-and-support/) for the exact 0.1 surface.

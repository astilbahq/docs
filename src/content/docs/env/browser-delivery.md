---
title: Deliver browser configuration
description: Generate a public projection, serve an inert same-origin JSON envelope, validate it before startup, and reject private imports with Vite.
---

Env delivers browser deployment and request configuration as inert JSON. Your application owns the endpoint; the generated projection and browser runtime validate that the response belongs to the expected contract, consumer, lifecycle, and origin before application code uses it.

This adds one configuration request. Use a public build entry instead when a value may be fixed in the browser artifact.

## Declare a browser target

Select only the public entries the browser needs:

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

Generate the modules:

```sh
pnpm exec astilba-env generate
```

The browser target produces two different interfaces:

- `.astilba/env/browserDeployment.server.ts` checks the application-owned source; and
- `.astilba/env/browser/browser.deployment.ts` contains the public projection and typed decoder, but no values.

The generated public projection does not contain `databaseUrl`, its source name, or its codec metadata.

## Return the exact envelope

Create a same-origin route that checks the public target and returns the selected values:

```ts
import { BOOTSTRAP_PROTOCOL } from "@astilba/env/browser";

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
      protocol: BOOTSTRAP_PROTOCOL,
      values: result.value,
    },
    {
      headers: { "Cache-Control": "private, no-store" },
    }
  );
};
```

The successful envelope has exactly seven top-level fields:

| Field | Source |
| --- | --- |
| `protocol` | `BOOTSTRAP_PROTOCOL`, currently `astilba.env.bootstrap/v1`. |
| `contract` | Generated `projection.contract`. |
| `consumer` | Generated `projection.consumer`. |
| `lifecycle` | Generated `projection.lifecycle`. |
| `projection` | Generated `projection.digest`. |
| `audience` | `{ origin }` derived from trusted canonical application configuration. |
| `values` | The successful generated target value. |

Do not derive the audience from an untrusted `Host` or forwarded header. If your platform constructs canonical origins at a trusted proxy boundary, test that boundary as application code.

Return `application/json` with a 2xx status. Redirects are refused. A response that can vary by request must include `Cache-Control: private, no-store`; the loader also requests every bootstrap with `cache: "no-store"`.

The endpoint contains public values, but authentication and authorisation can still matter for request-specific configuration. Env does not choose the route or access policy.

## Validate before use

Load the envelope with the generated projection:

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

renderApplication(bootstrap.values);
```

The result is typed from the generated projection. Its values are copied into frozen, owned data before return.

`loadBrowserBootstrap` refuses:

- a request URL outside the expected origin;
- fetch failure, redirects, a non-2xx status, or a final cross-origin URL;
- a non-JSON content type, invalid UTF-8, invalid JSON, or a body over 65,536 bytes;
- missing or unknown envelope fields;
- a different audience, protocol, contract, consumer, lifecycle, or projection digest; and
- missing, unknown, or invalid typed values.

It throws `BootstrapFailure` with a stable `code` such as `BOOTSTRAP_PROJECTION_MISMATCH`. Do not continue with ambient, baked, or previously cached values after a failure.

```ts
import {
  BootstrapFailure,
  loadBrowserBootstrap,
} from "@astilba/env/browser";

try {
  const bootstrap = await loadBrowserBootstrap(options);
  renderApplication(bootstrap.values);
} catch (error) {
  const code =
    error instanceof BootstrapFailure ? error.code : "BOOTSTRAP_UNEXPECTED";

  renderConfigurationFailure(code);
}
```

Keep failure UI application-specific and perceivable. A retry should perform a new validated load; it should not weaken any expected identity.

## Delay application import

Use `startBrowserApplication` when configuration must validate before the main application module enters the browser graph:

```ts
import { startBrowserApplication } from "@astilba/env/browser";

import { projection } from "./.astilba/env/browser/browser.deployment";

await startBrowserApplication({
  endpoint: "/api/env",
  expectedAudience: { origin: window.location.origin },
  fetch: globalThis.fetch,
  importApplication: () => import("./application"),
  projection,
  requestBaseUrl: window.location.href,
});
```

The imported module must export `start(values, audience)`. Env loads and validates the bootstrap first, imports the application second, then calls `start`.

If your framework has already transported the exact envelope as inert data, use `parseBrowserBootstrap({ source, expectedAudience, projection })`. It applies the same envelope and value checks without fetching. The source remains JSON data; do not turn it into executable JavaScript.

## Use build values without a request

A public build entry is validated during generation and emitted into a browser-only module:

```ts
entries: {
  releaseSha: env.public.build.string({
    minimumCodePoints: 7,
    maximumCodePoints: 64,
  }),
},
consumers: {
  browser: env.browser(["releaseSha"]),
},
targets: {
  browserBuild: env.process("browser", {
    releaseSha: "RELEASE_SHA",
  }),
},
```

Generate with the value available:

```sh
RELEASE_SHA=abcdef0 pnpm exec astilba-env generate
```

Then import the frozen value directly:

```ts
import { configuration } from "./.astilba/env/browser/browser.build";

configuration.releaseSha;
```

Changing `RELEASE_SHA` requires generation and a new application build. The generated module contains the public value, so do not use build entries for secrets.

## Reject private browser imports

Add the Vite boundary to every Vite browser build:

```ts
import { astilbaEnvBrowserBoundary } from "@astilba/env/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [astilbaEnvBrowserBoundary()],
});
```

The plugin rejects browser-graph imports of:

- the root `@astilba/env` declaration package;
- `@astilba/env/runtime` and `@astilba/env/vite`;
- `astilba.env.ts` or `.mts`;
- generated `*.server.ts` modules;
- `contract.json`, `snapshot.json`, and consumer metadata; and
- package-owned files outside the public browser runtime.

It permits `@astilba/env/browser` and generated `browser/*.build.ts`, `browser/*.deployment.ts`, and `browser/*.request.ts` modules.

The plugin is a build-time guard, not a substitute for deliberate import structure. Frameworks that do not use Vite must enforce the same boundary in their build and tests. Scan production browser artifacts for private entry names, binding names, and test canary values before deployment.

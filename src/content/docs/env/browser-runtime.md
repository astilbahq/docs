---
title: Browser
description: Load and validate public browser configuration through Env's isolated browser runtime.
---

The `@astilba/env/browser` export validates public configuration before browser application code uses it. It accepts only generated public projections; declaration builders, private targets, provider bindings, and complete contract metadata stay outside the browser graph.

Browser delivery is application-owned. Env validates either a same-origin JSON response or inert JSON that your framework has already transported.

## Import only the browser surface

Generate a public browser consumer and import its projection:

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

`loadBrowserBootstrap` requests with `cache: "no-store"` and `redirect: "error"`. It checks the same-origin request and final response, JSON content type and size, envelope identity, expected audience, generated projection digest, exact fields, and typed values.

The returned values are copied into frozen, owned data.

## Parse framework-transported JSON

Use `parseBrowserBootstrap` when a framework has already delivered the exact envelope as inert data:

```ts
import { parseBrowserBootstrap } from "@astilba/env/browser";

import { projection } from "./.astilba/env/browser/browser.deployment";

const bootstrap = parseBrowserBootstrap({
  expectedAudience: { origin: window.location.origin },
  projection,
  source: JSON.parse(document.querySelector("#env")?.textContent ?? ""),
});
```

The source must remain JSON data. Do not replace it with an executable script assignment or a mutable global.

## Delay the application import

Use `startBrowserApplication` when the main application module must not enter the active graph before configuration validates:

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

The imported module exports `start(values, audience)`. Env validates first, imports second, and calls `start` last.

## Handle failures without fallback

Browser operations throw `BootstrapFailure` with a stable code:

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

Do not continue with ambient, baked, or previously cached values after validation fails. A retry should perform a new validation without weakening the expected audience or projection identity.

## Keep private modules out of the graph

Browser code may import:

- `@astilba/env/browser`;
- generated `browser/*.build.ts` modules; and
- generated `browser/*.deployment.ts` or `browser/*.request.ts` projections.

It must not import the root package, `@astilba/env/runtime`, the Env configuration file, generated `*.server.ts` targets, or complete generated metadata.

Use the [Vite integration](/docs/env/vite/) where Vite builds the browser graph. Other build tools need an equivalent application-owned boundary.

Continue with [Deliver browser configuration](/docs/env/browser-delivery/) to build the endpoint and exact envelope.

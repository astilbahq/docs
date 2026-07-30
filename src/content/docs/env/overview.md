---
title: Overview
description: Understand Astilba Env's contract model, generated boundaries, supported runtimes, and responsibility boundary.
---

Astilba Env turns one portable TypeScript declaration into generated configuration interfaces for the artifacts that consume them. It keeps browser and server projections physically separate, distinguishes build, deployment, and request values, and validates values at the lifecycle where they become available.

The 0.2 release is a public alpha. Use it when explicit configuration boundaries are worth adopting before the API reaches stability.

## Decide whether Env fits

| You want to… | Fit |
| --- | --- |
| Promote one built artifact through several deployments | Declare deployment values and resolve them from each deployment's source object. |
| Keep private names and bindings out of browser bundles | Browser consumers receive generated public projections only. |
| Validate build, deployment, and request values separately | Each entry declares its lifecycle; each generated target resolves one lifecycle. |
| Run without an Astilba service | Generation, checking, and planning are local; the application owns value storage and delivery. |
| Validate Worker bindings without a Node.js compatibility layer | Env 0.2 admits a narrow generated deployment-target path for Cloudflare Workers. |
| Inject arbitrary configuration through inline JavaScript | Not supported. Browser deployment and request values use inert, same-origin JSON. |
| Import one mutable environment object everywhere | Not supported. Generated modules create explicit artifact boundaries. |
| Provision secrets or platform bindings | Not supported. Env validates application-owned sources; it does not operate providers. |

## Model four decisions

An Env declaration records four independent decisions:

1. an entry's visibility is `public` or `private`;
2. its lifecycle is `build`, `deployment`, or `request`;
3. its codec defines the accepted input and typed output; and
4. a consumer selects which entries one artifact may know.

A target then maps one consumer and one complete lifecycle to names in an application-owned source object.

```ts
import { defineEnvironment, env } from "@astilba/env";

export default defineEnvironment({
  id: "com.example.application",
  entries: {
    apiOrigin: env.public.deployment.origin(),
    databaseUrl: env.private.deployment.secret(),
  },
  consumers: {
    browser: env.browser(["apiOrigin"]),
    server: env.server(["databaseUrl"]),
  },
  targets: {
    browserDeployment: env.process("browser", {
      apiOrigin: "API_ORIGIN",
    }),
    serverDeployment: env.process("server", {
      databaseUrl: "DATABASE_URL",
    }),
  },
});
```

The declaration does not read either value.

## Generate artifact-specific modules

Run generation on a supported Node.js release and check drift in CI:

```sh
pnpm exec astilba-env generate
pnpm exec astilba-env generate --check
```

The declaration above produces separate interfaces:

```text
.astilba/env/browser/browser.deployment.ts
.astilba/env/browserDeployment.server.ts
.astilba/env/serverDeployment.server.ts
```

Generated target modules export typed `check(source)` and `load(source)` functions. Generated browser build modules may contain frozen public build values; deployment and request projection modules contain the public decoder and compatibility identity for one consumer and lifecycle, but no values, private entry names, private bindings, or complete contract metadata.

Read [Lifecycles and projections](/docs/env/lifecycles-and-projections/) for the generated file model.

## Choose the runtime boundary

| Runtime | Supported Env surface |
| --- | --- |
| Node.js | Declaration authoring, generator, CLI, and generated server targets. |
| Browser | Isolated public bootstrap loading and projection validation. |
| Cloudflare Workers | Generated deployment-lifecycle server targets using first-party codecs. Authoring and generation stay on Node.js. |

Framework pages explain application-owned wiring:

- [Vite](/docs/env/vite/) adds a private-module browser-graph boundary;
- [Next.js](/docs/env/nextjs/) wires generated targets and public JSON delivery into App Router or Pages Router; and
- [Deliver browser configuration](/docs/env/browser-delivery/) defines the framework-neutral endpoint protocol.

Check [Release and support](/docs/env/release-and-support/) before choosing a runtime. Evidence for one package export does not make every Env export portable to that runtime.

## Keep ownership explicit

Env owns:

- contract compilation and deterministic generated output;
- public and server projection separation;
- source checking and redacted diagnostics;
- browser envelope validation; and
- value-free compatibility planning.

Your application and platform own:

- environment variables, secret managers, and provider bindings;
- when generated targets are checked or loaded;
- browser routes, trusted canonical origins, and response policy;
- framework startup and failure presentation; and
- provisioning, deployment, and live inventory.

Continue with [Configure a Node application](/docs/env/quickstart/) for the smallest working setup.

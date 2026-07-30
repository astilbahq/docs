---
title: Release and support
description: Check the package, runtime, export, framework, and public-alpha boundaries of Astilba Env 0.2.1.
---

`@astilba/env` 0.2.1 is a public alpha. The package and source are public, so applications can evaluate the complete contract, but the API may change deliberately before a stable release.

Install the exact alpha when reproducibility matters:

```sh
pnpm add @astilba/env@0.2.1 --save-exact
```

Version 0.2.1 fixes generated TypeScript narrowing for public `stringList` and `safeInteger` entries, and rejects sparse lists.

## Supported public surface

| Surface | 0.2.1 status |
| --- | --- |
| `defineEnvironment` and `env` builders | Public on supported Node.js releases |
| `astilba-env generate` and `generate --check` | Public on supported Node.js releases |
| `astilba-env check --target ID` | Public for targets the CLI can validate |
| `astilba-env plan --base GIT_REF` | Public on supported Node.js releases |
| Generated Node.js `check` and `load` functions | Public |
| Generated Cloudflare Workers deployment targets | Public with first-party codecs; see the narrow runtime boundary below |
| Generated public browser projections | Public |
| Inert same-origin JSON browser protocol | Public |
| Vite private-module boundary | Public for Vite 8.1.5 or later within Vite 8 |
| Next.js App and Pages Router wiring | Application-owned integration; no Astilba adapter |
| Hosted configuration service | Not provided |
| Secret storage or provider provisioning | Not provided |
| Stable API compatibility | Not promised during the public alpha |

## Runtime matrix

| Operation | Node.js | Browser | Cloudflare Workers |
| --- | --- | --- | --- |
| Import `@astilba/env` and author declarations | Supported | Blocked | Blocked |
| Run the generator, CLI, or planner | Supported | Blocked | Blocked |
| Import a generated server target with first-party codecs | Supported | Blocked | Supported for deployment lifecycle only |
| Import a generated target with `opaque` Standard Schema validators | Supported | Blocked | Not admitted |
| Import `@astilba/env/browser` and public generated browser modules | Not the browser production target | Supported | Blocked |
| Import `@astilba/env/vite` | Supported in Vite configuration | Blocked | Blocked |

The package supports these Node.js ranges:

- Node.js 22.14.0 or later within Node 22;
- Node.js 24 within Node 24; and
- Node.js 26 within Node 26.

The Cloudflare Workers path does not require `nodejs_compat` for Env. It accepts a Wrangler-generated `Env` binding interface without an index signature, reads only the declared binding names, and leaves unrelated capability bindings to application code.

Runtime support is export-specific. Evidence for the generated runtime does not make the declaration builders, CLI, browser runtime, or Vite plugin portable to workerd.

## Package boundaries

| Import or command | Responsibility |
| --- | --- |
| `@astilba/env` | Declaration builders on Node.js |
| `@astilba/env/runtime` | Runtime operations used by generated server targets; exposed to admitted Node.js and workerd consumers |
| `@astilba/env/browser` | Public browser bootstrap loading and validation |
| `@astilba/env/vite` | Node.js Vite boundary that rejects private Env modules from browser graphs |
| `astilba-env` | Node.js command-line interface |

There is no `@astilba/env/next` export. Next.js support uses the same generated modules and browser protocol as another framework.

## Cloudflare Workers boundary

Env 0.2 adds generated process-target support that was not part of 0.1. The admitted Workers surface is deliberately limited to:

- a generated server target;
- the `deployment` lifecycle;
- first-party Env codecs;
- a direct `check(env)` or `load(env)` call inside the handler; and
- application-owned Wrangler `vars`, `secrets.required`, secret values, and capability bindings.

Request-lifecycle targets and arbitrary Standard Schema validator graphs are not part of the Workers support claim. Env does not inspect live bindings, store secrets, call provider APIs, provision resources, or plan automatic redeployments.

Read [Cloudflare Workers](/docs/env/cloudflare-workers/) before adopting this path.

## Browser boundary

Browser deployment and request values must arrive as same-origin JSON. The runtime validates:

- response status, redirect state, content type, and size;
- the expected audience origin;
- the bootstrap protocol;
- contract, consumer, lifecycle, and projection identity; and
- the exact generated value projection.

The runtime fetches with `cache: "no-store"`. An application endpoint whose response can vary by request must also send `Cache-Control: private, no-store`.

Env does not inject inline JavaScript, write to `window`, mutate HTML, or choose an application route.

## Alpha boundaries

Plan for these constraints in 0.2:

- generated files are application-owned build artifacts and must be regenerated when the declaration changes;
- public build values require an explicit build source during generation;
- custom Standard Schema validation is available only for private server `opaque` entries;
- browser projections use Env's portable built-in codecs;
- compatibility plans contain descriptors and change classifications, never configuration values;
- diagnostics are deliberately redacted; and
- framework-specific startup, routing, authentication, and failure UI remain application responsibilities.

The public [Env repository](https://github.com/astilbahq/env) is the source and issue tracker for the alpha. Report a contract, generation, runtime, or browser-boundary defect there.

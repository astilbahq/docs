---
title: Release and support
description: Check the package, runtime, export, framework, and public-alpha boundaries of Astilba Env 0.1.0.
---

`@astilba/env` 0.1.0 is the first public alpha. The package and source are public so applications can evaluate the complete contract, but the API may change deliberately before a stable release.

Install the exact alpha when reproducibility matters:

```sh
pnpm add @astilba/env@0.1.0
```

## Supported public surface

| Surface | 0.1.0 status |
| --- | --- |
| `defineEnvironment` and `env` builders | Public |
| `astilba-env generate` | Public |
| `astilba-env generate --check` | Public |
| `astilba-env check --target ID` | Public |
| `astilba-env plan --base GIT_REF` | Public |
| Generated server `check` and `load` functions | Public |
| Generated public browser projections | Public |
| Inert same-origin JSON browser protocol | Public |
| Vite private-module boundary | Public for Vite 8 |
| Next.js App and Pages Router wiring | Application-owned integration; no Astilba adapter |
| Hosted configuration service | Not provided |
| Secret storage or `.env` loading | Not provided |
| Stable API compatibility | Not promised during the public alpha |

## Package boundaries

| Import or command | Responsibility |
| --- | --- |
| `@astilba/env` | Portable declaration builders |
| `@astilba/env/runtime` | Runtime operations used by generated server targets |
| `@astilba/env/browser` | Public browser bootstrap loading and validation |
| `@astilba/env/vite` | Vite boundary that rejects private Env modules from browser graphs |
| `astilba-env` | Node command-line interface |

There is no `@astilba/env/next` export. Next.js support uses the same generated modules and browser protocol as another framework.

## Runtime requirements

The package supports these Node.js ranges:

- Node.js 22.14.0 or later within Node 22;
- Node.js 24 within Node 24; and
- Node.js 26 within Node 26.

The optional Vite integration supports Vite 8.1.5 or later within Vite 8.

The portable browser kernel has evidence on Bun and workerd. That evidence does not make the Node CLI or generated process-target modules portable to those runtimes.

## Browser boundary

Browser deployment and request values must arrive as same-origin JSON. The runtime validates:

- the response status, redirect state, content type, and size;
- the expected audience origin;
- the bootstrap protocol;
- the contract, consumer, lifecycle, and projection digest; and
- the exact generated value projection.

The runtime fetches with `cache: "no-store"`. An application endpoint whose response can vary by request must also send `Cache-Control: private, no-store`.

Env does not inject inline JavaScript, write to `window`, mutate HTML, or choose an application route.

## Alpha boundaries

Plan for these constraints in 0.1:

- generated files are application-owned build artifacts and must be regenerated when the declaration changes;
- public build values require an explicit build source during generation;
- custom Standard Schema validation is available only for private server `opaque` entries;
- browser projections use Env's portable built-in codecs;
- compatibility plans contain descriptors and change classifications, never configuration values;
- diagnostics are deliberately redacted; and
- framework-specific startup, routing, authentication, and failure UI remain application responsibilities.

The public [Env repository](https://github.com/astilbahq/env) is the source and issue tracker for the alpha. Report a contract, generation, runtime, or browser-boundary defect there.

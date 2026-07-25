---
title: Choose a recipe
description: Compare the four versioned project recipes supported by Astilba Create 0.2.0.
---

Choose the recipe whose complete runtime and verification contract matches your project. Create does not expose its internal profiles as a mix-and-match feature selector.

All four recipes are version `2` in the project manifest.

## Compare the recipes

| Recipe | Starting point | Package posture | Recipe-specific verification |
| --- | --- | --- | --- |
| `typescript-library` | ESM TypeScript package with declarations | Public package | TypeScript build, tests, Publint, and Are the Types Wrong against the packed package |
| `react-vite-spa` | Client-rendered React application built by Vite | Private application | TypeScript, Vitest, and a Vite production build |
| `astro-static-site` | Statically rendered Astro site | Private application | Astro type checking, Vitest smoke test, and a static production build |
| `cloudflare-worker-service` | TypeScript service for Cloudflare Workers | Private service | Generated Workers types, worker-pool tests, three TypeScript configurations, and a dry-run Wrangler deployment build |

## Shared foundation

Every recipe includes:

```text
.astilba/project.json
.github/ISSUE_TEMPLATE/
.github/workflows/
.editorconfig
.gitattributes
.gitignore
.node-version
.npmrc
AGENTS.md
CLAUDE.md -> AGENTS.md
CONTRIBUTING.md
LICENSE
README.md
SECURITY.md
docs/repository-settings.md
knip.json
oxfmt.config.ts
oxlint.config.ts
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
renovate.json
tsconfig.json
vitest.config.ts
```

The dependency, toolchain, action, and container references are exact pins. Renovate holds new releases for at least three days and uses conservative automerge rules. The verification workflow runs with a frozen lockfile on Node.js 22.18.0 and 24.18.0 in Create 0.2.0.

## TypeScript library

Choose `typescript-library` for a publishable ESM package:

```sh
npm create astilba@latest -- my-library \
  --recipe typescript-library \
  --description "A useful TypeScript library." \
  --github-owner example \
  --package-name @example/my-library
```

The recipe adds:

```text
src/index.ts
tests/index.test.ts
tsconfig.build.json
```

Its package export includes ESM JavaScript and declarations. `pnpm verify` builds the package and checks the packed public surface with Publint and Are the Types Wrong.

## React and Vite application

Choose `react-vite-spa` for a client-rendered single-page application:

```sh
npm create astilba@latest -- my-app \
  --recipe react-vite-spa \
  --description "A useful web application." \
  --github-owner example
```

The recipe adds:

```text
index.html
src/app.tsx
src/main.tsx
src/project.json
tests/project.test.ts
vite.config.ts
```

The package is private. It supplies development, build, preview, test, and verification scripts, but no hosting provider or deployment automation.

## Astro static site

Choose `astro-static-site` for a statically rendered Astro site:

```sh
npm create astilba@latest -- my-site \
  --recipe astro-static-site \
  --description "A useful static site." \
  --github-owner example
```

The recipe adds:

```text
astro.config.mjs
src/pages/index.astro
tests/smoke.test.ts
```

The package is private. `pnpm build` creates the static site, but the recipe does not choose or configure a hosting provider.

## Cloudflare Worker service

Choose `cloudflare-worker-service` for a TypeScript service that runs on Cloudflare Workers:

```sh
npm create astilba@latest -- my-worker \
  --recipe cloudflare-worker-service \
  --description "A useful Worker service." \
  --github-owner example
```

The Worker project name must contain at most 63 lowercase letters, digits, or hyphens and cannot start or end with a hyphen. Create applies this stricter recipe rule to an explicit `--project-name` and to the name inferred from the destination.

The recipe adds:

```text
src/index.ts
tests/index.test.ts
tests/tsconfig.json
tsconfig.config.json
vitest.config.ts
wrangler.jsonc
```

The package is private. Its build generates binding types and runs `wrangler deploy --dry-run`; only `pnpm deploy` performs a deployment. Review `wrangler.jsonc` and authenticate Wrangler before using that command.

## Know what is not a recipe option

Create 0.2.0 does not offer switches for Panda CSS, browser testing, monitoring, authentication, databases, framework deployment, or other optional systems. It also does not advertise arbitrary combinations of the internal project profiles.

Add project-specific capabilities after generation and verify them in your repository. A capability becomes part of Create only when Astilba can maintain its complete development, CI, deployment, and verification contract.

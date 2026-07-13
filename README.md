# Astilba documentation

The public documentation site for Astilba products, built with Astro Starlight.

The structure borrows TanStack's useful multi-library context and Better Auth's concise, task-focused writing, while keeping documentation navigation free of sponsor rails, ads, and duplicated marketing links.

## Visual system

- Starlight retains ownership of the global shell behavior, Pagefind search engine, theme state, and code rendering.
- Panda CSS owns Astilba's role-based semantic tokens and the styles for markup rendered by this repository. The Starlight bridge translates those owned roles without exposing a generic colour scale. Panda's reset is intentionally disabled so it does not compete with Starlight.
- Small compatibility stylesheets under `src/styles/starlight/` target markup rendered by Starlight, Pagefind, and Expressive Code.
- Small Base UI React islands own the accessible product/version menus, animated sidebar disclosures, and per-page Markdown actions.
- The header keeps branding, search, repository, sponsorship, and appearance controls together; the sidebar stays focused on product navigation.
- Geist, Inter, and JetBrains Mono provide a compact technical register.
- Near-black ink, near-white canvas, square controls, and a restrained type hierarchy carry the interface.
- The official Astilba logomark adapts to light and dark themes beside the inline site title.
- A warm signal accent is reserved for focus, links, and small state details rather than navigation backgrounds.
- Page descriptions come from frontmatter through the `PageTitle` override.

## Current scope

- One documented product: Cache.
- Thirteen progressively disclosed preview pages backed only by the public repository surface.
- Base UI context switching and animated, session-persisted sidebar sections.
- Starlight table of contents, theme control, code presentation, and Pagefind search.
- Visible release-status language wherever a surface is not yet shipped.
- Markdown content under `src/content/docs/`, with products, independent versions, page order, and destination icons defined in `src/docs/`.

## Development

```bash
pnpm install
pnpm dev
```

Installation generates Panda's ignored `styled-system/` bindings. Run `pnpm panda:codegen` after changing `panda.config.ts`; the dev and build commands extract component styles automatically. The local site runs at `http://localhost:4321` by default.

## Documentation catalog

Each product has one typed catalog file under `src/docs/products/`. A product declares its default page, independent versions, stable page keys, sidebar sections, and destination icons. Version `basePath` values own their public URLs, so a future archived release can coexist with the current release without imposing one global docs version.

Keep the default version pointed at the release readers should land on. The selectors preserve a stable page key across products and versions when that page exists, then fall back to the destination product's overview.

## Checks

```bash
pnpm test:browser:install
pnpm verify
```

Development and type checks do not require a deployed origin. Production builds do: `ASTILBA_DOCS_SITE` must be the public HTTP or HTTPS origin, with no path, so canonical links and generated agent resources cannot silently point at the wrong host.

`pnpm verify` regenerates Panda bindings, checks Astro and TypeScript, runs focused Vitest coverage, checks unused code and dependencies with Knip, builds and validates the Wrangler bundle without uploading it, and drives the production build in Chromium with Playwright and axe. The browser suite covers Pagefind, mobile navigation, persisted sidebar state, themes, page actions, raw Markdown routes, and representative light/dark/overlay accessibility states. Install Chromium once per machine with `pnpm test:browser:install`.

The production build creates the Pagefind search index, validates internal links, and then verifies the deployed artifact set in `dist/`. Run `pnpm preview` to inspect that build locally.

Repository automation also runs Actionlint, Zizmor, dependency review, a complete-lockfile OSV scan, and Conventional Commit PR-title validation. Renovate keeps exact package and immutable workflow pins current on a weekly cadence; major changes always require manual review.

## Deployment

The production site is configured for [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) at `docs.astilba.com`. Astro still generates the entire site at build time; there is no Worker entry point or server-side request path. This keeps the current deployment static while leaving room to add a Worker later if the docs gain genuine runtime behavior.

Validate the generated assets and Wrangler configuration without uploading anything:

```bash
pnpm deploy:dry-run
```

Deploy the same build to the configured Worker and custom domain:

```bash
pnpm deploy
```

`wrangler.jsonc` is the deployment source of truth. Its Custom Domain route lets Cloudflare own the `docs.astilba.com` DNS record and certificate rather than proxying an external origin.

GitHub Actions automatically runs the same deployment after the verification job succeeds on `main`. The `production` environment scopes `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; pull requests can validate Wrangler but cannot access those credentials or deploy. Cloudflare recommends a custom API token restricted to Workers editing for the Astilba account.

## Agent-readable documentation

Each catalogued documentation page has a sibling `.md` representation with YAML provenance for its canonical page, product, documentation version, lifecycle, and public source file. HTML pages advertise that representation with `rel="alternate"` and point to the site-wide `llms.txt` index with `rel="describedby"`.

Production builds also create `llms-small.txt`, `llms-full.txt`, a Cache-specific document set under `_llms-txt/`, `robots.txt`, and the sitemap. The Cache document set follows the typed sidebar order and states that the package is unreleased and not installable. HTTP responses and `robots.txt` allow search indexing and real-time AI input while reserving the documentation from model training. The production artifact check keeps those signals aligned and verifies the response-level links to Markdown and `llms.txt`.

## Keeping product status current

Treat `src/content/docs/cache/api-status.md` as the release-state ledger. Update it first when public behavior changes, then reconcile the overview, runtime status, concepts, and examples against it. Verify claims from the public package exports, implementation, and tests; do not infer shipped support from an internal source file or engineering milestone tag.

## Content boundary

This is a public documentation repository. Never copy private handbook prose, ADR rationale, research, red-team material, or incident narrative into it. Public facts must come from released code, public types, public tests, or explicitly approved launch copy.

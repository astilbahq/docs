# Astilba documentation

The public documentation site for Astilba products, built with Astro Starlight.

The structure borrows TanStack's useful multi-library context and Better Auth's concise, task-focused writing, while keeping documentation navigation free of sponsor rails, ads, and duplicated marketing links.

## Visual system

- Starlight retains ownership of the global shell, responsive behavior, search, and code rendering.
- One Base UI React island owns the accessible product/version menus and animated sidebar disclosures.
- The header is reserved for branding and search; repository and appearance controls live in the sidebar footer.
- Geist and Geist Mono provide a compact technical register.
- True white and black surfaces, warm-neutral dividers, square controls, and restrained type hierarchy carry the interface.
- The official Astilba flower mark adapts to light and dark themes.
- A warm signal accent is reserved for focus, links, and small state details rather than navigation backgrounds.
- Page descriptions come from frontmatter through the `PageTitle` override.

## Current scope

- One documented product: Cache.
- Seven concise preview pages backed only by the public repository surface.
- Base UI context switching and animated, session-persisted sidebar sections.
- Starlight table of contents, theme control, code presentation, and Pagefind search.
- Visible release-status language wherever a surface is not yet shipped.
- Markdown content under `src/content/docs/`, with products, independent versions, page order, and destination icons defined in `src/docs/`.

## Development

```bash
pnpm install
pnpm dev
```

The local site runs at `http://localhost:4321` by default.

## Documentation catalog

Each product has one typed catalog file under `src/docs/products/`. A product declares its default page, independent versions, stable page keys, sidebar sections, and destination icons. Version `basePath` values own their public URLs, so a future archived release can coexist with the current release without imposing one global docs version.

Keep the default version pointed at the release readers should land on. The selectors preserve a stable page key across products and versions when that page exists, then fall back to the destination product's overview.

## Checks

```bash
pnpm check
pnpm build
```

The production build creates the Pagefind search index. Run `pnpm preview` to test the built site locally.

## Content boundary

This is a public documentation repository. Never copy private handbook prose, ADR rationale, research, red-team material, or incident narrative into it. Public facts must come from released code, public types, public tests, or explicitly approved launch copy.

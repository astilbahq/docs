# Astilba public documentation

This repository contains the public documentation experience for Astilba products.

## Content boundaries

- The private `astilbahq/handbook` is context, never a publish source.
- Never quote or copy private specs, errata, ADR rationale, research, red-team material, or incident narrative.
- Derive technical claims from public exports, public behavior, tagged releases, and approved public copy.
- Mark unreleased or incomplete surfaces plainly. Never turn a roadmap into a promise.
- Do not expose parked product ideas merely to fill navigation.

## Information architecture

- Starlight owns the global shell, responsive navigation, search, and theme behavior.
- `src/components/DocsSidebar.tsx` is the single Base UI React island. It owns product/version menus, recursive collapsibles, and desktop session persistence; keep the rest of the documentation shell server-rendered unless an interaction genuinely requires another island.
- `src/components/Header.astro` owns branding, search, theme switching, and compact global actions. Keep the documentation sidebar focused on product navigation; it has no footer action rail.
- `src/docs/` owns the typed product catalog, independent version trees, page ordering, and destination icons.
- `src/content/docs/` contains public Markdown content.
- Each product owns its sidebar and overview route.
- Prefer six useful pages to sixty empty ones.
- Guides describe an outcome. Concepts explain one mental model. Reference pages document one public surface precisely.
- Sponsor grids, ads, partner placements, and donation blocks do not belong in docs navigation or reading rails.

## Writing style

- Lead with the outcome.
- Use active voice and second person.
- Keep paragraphs short and headings concrete.
- Pair guarantees with their cost or failure behavior.
- Use sentence case for headings.
- Keep examples executable against the documented release state.

## Visual conventions

- Preserve Starlight's native shell behavior. Panda CSS owns Astilba tokens and styles for repository-owned markup; keep `preflight: false` so Starlight remains the reset and shell authority.
- Keep selectors for Starlight, Pagefind, Markdown, and Expressive Code markup in the focused compatibility modules under `src/styles/starlight/`. Do not move those selectors into a component merely to eliminate CSS.
- Use semantic tokens from `panda.config.ts` in owned components. The Starlight token bridge is the only place that should translate Astilba tokens to `--sl-*` variables.
- Keep every theme-bearing value in Astilba's role-based Panda tokens. The Starlight bridge may translate those roles to its numbered compatibility variables, but must never introduce or expose a generic colour scale.
- Use Base UI primitives for sidebar menus and disclosures so keyboard, focus, and screen-reader behavior remain consistent.
- Keep the interface border-led, compact, and nearly monochrome.
- Use Geist for UI and prose, Inter for headings, and JetBrains Mono for code and small utility labels.
- Keep controls and content surfaces square or lightly rounded. Avoid decorative cards and large shadows.
- Use the official theme-aware Astilba logomark with an inline site title in the header.
- Reserve the warm signal accent for focus, links, and meaningful state details.
- Test light, dark, desktop, mobile navigation, code blocks, and production Pagefind search after visual changes.

## Toolchain

- Package manager: pnpm.
- Framework: Astro with Starlight.
- Styling: Panda CSS for Astilba-owned components, plus modular Starlight compatibility CSS.
- `pnpm dev` starts the local site.
- `pnpm panda:codegen` regenerates the ignored typed styling bindings after Panda configuration changes.
- `pnpm check` validates Astro, content, and TypeScript.
- `pnpm build` produces the static site and Pagefind search index.
- Keep dependency versions exact.

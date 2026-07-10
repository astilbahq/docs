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
- `src/components/Header.astro` keeps global chrome to branding and search. `src/components/SidebarFooter.astro` owns social links, binary theme switching, and any future language selector at every breakpoint.
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

- Preserve Starlight's native shell behavior; prefer documented tokens and CSS before component overrides.
- Use Base UI primitives for sidebar menus and disclosures so keyboard, focus, and screen-reader behavior remain consistent.
- Keep the interface border-led, compact, and nearly monochrome.
- Use Geist for UI and prose and Geist Mono for code and small utility labels.
- Keep controls and content surfaces square or lightly rounded. Avoid decorative cards and large shadows.
- Use the official theme-aware Astilba flower mark in the header.
- Reserve the warm signal accent for focus, links, and meaningful state details.
- Test light, dark, desktop, mobile navigation, code blocks, and production Pagefind search after visual changes.

## Toolchain

- Package manager: pnpm.
- Framework: Astro with Starlight.
- `pnpm dev` starts the local site.
- `pnpm check` validates Astro, content, and TypeScript.
- `pnpm build` produces the static site and Pagefind search index.
- Keep dependency versions exact.

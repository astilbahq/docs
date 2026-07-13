---
title: Astilba documentation
description: Practical documentation for Astilba infrastructure libraries, with preview boundaries called out explicitly.
tableOfContents: false
---

Astilba builds portable infrastructure libraries with explicit correctness boundaries. These docs describe what the public code can do today, the guarantees it is designed to preserve, and the places where the implementation is still incomplete.

:::caution[The current product is a development preview]
Astilba Cache is not published and has no supported production installation path. Examples explain the public API in the source repository; they are not a release announcement.
:::

## Products

### [Cache](/cache/overview/)

A portable TypeScript caching library with explicit soft and hard invalidation, classified stale-on-error resilience, and privacy-aware storage scopes.

Start with the [overview](/cache/overview/), learn [how Cache works](/cache/how-it-works/), or inspect the [current API status](/cache/api-status/) before depending on a surface.

## How to read these docs

- **Start** pages explain the product and walk through the API shape.
- **Guides** focus on one task, such as reading or invalidating data.
- **Concepts** explain the consistency, resilience, and privacy model.
- **Reference** pages are the release-state ledger. When a guide and the status page appear to differ, follow the status page.

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

Start with the [overview](/cache/overview/), check the [React and server-app boundary](/cache/react-and-server-apps/), or follow the [preview walkthrough](/cache/quickstart/).

## How to read these docs

- **Start** pages explain who the product is for, walk through the API shape, and define its vocabulary.
- **Guides** focus on one task, such as reading or invalidating data.
- **Concepts** explain the read, invalidation, consistency, and resilience models.
- **Advanced** pages document runtime composition and driver implementation status.
- **Reference** contains the complete root API surface and the release-state ledger. When another page and the status page appear to differ, follow the status page.

## For agents

Use the public [documentation MCP](/agents/mcp/) to search and read the same published Markdown corpus through a read-only protocol endpoint.

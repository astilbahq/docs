---
title: Overview
description: Portable infrastructure tools and libraries with explicit correctness boundaries, documented as they exist today.
tableOfContents: false
---

Astilba builds portable infrastructure tools and libraries with explicit correctness boundaries. These docs describe each released or reviewed surface, what its guarantees cost, and which parts remain incomplete.

## Products

### [Create](/docs/create/)

A deterministic CLI that generates complete TypeScript projects from four maintained recipes.

`create-astilba` 0.1.0 is released on npm. Start with [Create your first project](/docs/create/quickstart/), compare the [recipe catalog](/docs/create/recipes/), or check the exact [release and support](/docs/create/release-and-support/) boundary.

### [Cache](/docs/cache/)

A portable server-side TypeScript cache with explicit invalidation, resilience, and privacy boundaries.

Start with the [overview](/docs/cache/overview/), check the [implementation status](/docs/cache/api-status/), review the [source walkthrough](/docs/cache/quickstart/), or learn about the source adapters for [Cloudflare Workers](/docs/cache/cloudflare-workers/) and [React Router](/docs/cache/react-and-server-apps/).

:::caution[Cache is a development preview]
`@astilba/cache` is not available from npm and has no supported production installation path. The implementation ledger records the exact reviewed source snapshot and incomplete release gates.
:::

## For agents

Fetch the [agent setup prompt](/docs/agent-setup/prompt.md) to connect a supported coding agent to Astilba's public documentation tools. The prompt configures documentation access only; it does not install either product.

Use the public [MCP server](/docs/agents/mcp/) directly to search and read the same published Markdown corpus through a read-only protocol endpoint.

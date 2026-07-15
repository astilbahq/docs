---
title: Astilba documentation
description: Practical documentation for Astilba infrastructure libraries, with preview boundaries called out explicitly.
tableOfContents: false
---

Astilba builds portable infrastructure libraries with explicit correctness boundaries. These docs describe what the public code does today, what each guarantee costs, and which parts are still incomplete.

:::caution[The current product is a development preview]
Astilba Cache is not available from npm and has no supported production installation path. The source repository now includes Cloudflare Workers and React Router adapters, but their presence in source is not a package release or production-support promise.
:::

## Products

### [Cache](/cache/overview/)

A server-side TypeScript cache with explicit soft and hard invalidation, classified stale-on-error resilience, privacy-aware storage scopes, and a portable capability boundary.

Start with the [overview](/cache/overview/), run the [local quickstart](/cache/quickstart/), or inspect the source adapters for [Cloudflare Workers](/cache/cloudflare-workers/) and [React Router](/cache/react-and-server-apps/).

## How to read these docs

- **Get started** explains who a product is for and provides the shortest honest path through its current release state.
- **Integrations** show how a product connects to a runtime or framework.
- **Guides** help you complete one application task, such as reading or invalidating data.
- **Concepts** explain the mental models and capability relationships behind those tasks.
- **Reference** records exact public surfaces, available implementations, and current completeness. When another page and the implementation ledger appear to differ, follow the ledger.

## For agents

Use the public [documentation MCP](/agents/mcp/) to search and read the same published Markdown corpus through a read-only protocol endpoint.

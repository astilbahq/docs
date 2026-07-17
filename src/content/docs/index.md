---
title: Overview
description: Portable infrastructure libraries with explicit correctness boundaries, documented as they exist today.
tableOfContents: false
---

Astilba builds portable infrastructure libraries with explicit correctness boundaries. These docs describe what the public code does today, what each guarantee costs, and which parts are still incomplete.

:::caution[The current product is a development preview]
Astilba Cache is not available from npm and has no supported production installation path. The source repository now includes Cloudflare Workers and React Router adapters, but their presence in source is not a package release or production-support promise.
:::

## Products

### [Cache](/cache/)

A portable server-side TypeScript cache with explicit invalidation, resilience, and privacy boundaries.

Start with the [overview](/cache/overview/), run the [local quickstart](/cache/quickstart/), or inspect the source adapters for [Cloudflare Workers](/cache/cloudflare-workers/) and [React Router](/cache/react-and-server-apps/).

## Sponsors

Astilba is currently independently funded. Sponsorship helps keep its libraries, tooling, and documentation public. [Sponsor Astilba on GitHub](https://github.com/sponsors/astilbahq).

## For agents

Fetch the [agent setup prompt](/agent-setup/prompt.md) to connect a supported coding agent to Astilba's public documentation tools. The prompt configures documentation access only; it does not install Cache.

Use the public [MCP server](/agents/mcp/) directly to search and read the same published Markdown corpus through a read-only protocol endpoint.

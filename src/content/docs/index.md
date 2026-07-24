---
title: Overview
description: Portable infrastructure libraries with explicit correctness boundaries, documented as they exist today.
tableOfContents: false
---

Astilba builds portable infrastructure libraries with explicit correctness boundaries. These docs describe the reviewed implementation, what each guarantee costs, and which parts are still incomplete.

:::caution[The current product is a development preview]
Astilba Cache is not available from npm and has no supported production installation path. The reviewed source snapshot includes Cloudflare Workers and React Router adapters, but the Cache repository is not publicly accessible and their presence in source is not a package release or production-support promise.
:::

## Products

### [Cache](/docs/cache/)

A portable server-side TypeScript cache with explicit invalidation, resilience, and privacy boundaries.

Start with the [overview](/docs/cache/overview/), check the [implementation status](/docs/cache/api-status/), review the [source walkthrough](/docs/cache/quickstart/), or learn about the source adapters for [Cloudflare Workers](/docs/cache/cloudflare-workers/) and [React Router](/docs/cache/react-and-server-apps/).

The implementation ledger records the exact reviewed snapshot and incomplete release gates.

## For agents

Fetch the [agent setup prompt](/docs/agent-setup/prompt.md) to connect a supported coding agent to Astilba's public documentation tools. The prompt configures documentation access only; it does not install Cache.

Use the public [MCP server](/docs/agents/mcp/) directly to search and read the same published Markdown corpus through a read-only protocol endpoint.

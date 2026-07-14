---
title: Documentation MCP
description: Connect an MCP client to search and read Astilba's published documentation.
prev: false
next: false
---

Astilba provides a public, read-only Model Context Protocol endpoint for its published documentation.

Configure a remote Streamable HTTP server with this URL:

```text title="MCP endpoint"
https://docs.astilba.com/mcp
```

The endpoint does not require credentials. It cannot change documentation, access accounts, or read private Astilba material.

## Tools

| Tool | Use it to |
| --- | --- |
| `search_docs` | Find published pages by words or API names, with optional product and documentation-version filters. |
| `read_doc` | Read a bounded chunk from a page returned by search or resource discovery. |

Both tools are read-only, non-destructive, and idempotent. Search returns at most 10 results per call. A read returns at most 32,000 UTF-16 characters and reports the next offset when more content remains.

## Resources

Every published Markdown page is also exposed as a fixed MCP resource. Resource URIs stay on `docs.astilba.com`; the server does not fetch arbitrary URLs.

When you need to make a release or availability claim about Cache, read [API status](/cache/api-status/) before relying on examples elsewhere in the documentation.

## Discovery

The endpoint publishes machine-readable connection metadata through the [MCP catalog](https://docs.astilba.com/.well-known/mcp/catalog.json), [server card](https://docs.astilba.com/mcp/server-card), and [API catalog](https://docs.astilba.com/.well-known/api-catalog). MCP Server Card discovery is experimental, so its metadata format may evolve while the protocol endpoint remains at the URL above.

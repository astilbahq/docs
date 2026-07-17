---
title: LLMs.txt
description: Choose a generated text corpus for an agent that reads documentation without MCP.
prev: false
next: false
---

Astilba publishes build-generated text files for language models and other clients that can fetch documentation but cannot connect to an MCP server. Every file is derived from the same public pages as this site.

## Choose a file

| File | Use it when |
| --- | --- |
| [`/docs/llms.txt`](https://astilba.com/docs/llms.txt) | The client needs a small index that links to the available documentation sets. |
| [`/docs/llms-small.txt`](https://astilba.com/docs/llms-small.txt) | Context is limited and an abridged copy of the documentation is sufficient. |
| [`/docs/llms-full.txt`](https://astilba.com/docs/llms-full.txt) | The client can accept the complete published documentation in one response. |
| [`/docs/_llms-txt/astilba-cache.txt`](https://astilba.com/docs/_llms-txt/astilba-cache.txt) | The task concerns only Astilba Cache and does not need site-wide material. |

The generated files are snapshots of the current deployment. Fetch them again when current behavior or release status matters.

## Access one page

Every published documentation page is also available as Markdown. Replace the trailing slash in a documentation URL with `.md`:

- [`/docs/cache/overview.md`](https://astilba.com/docs/cache/overview.md) — Cache overview and release context.
- [`/docs/cache/api-reference.md`](https://astilba.com/docs/cache/api-reference.md) — Cache API reference.
- [`/docs/agents/mcp.md`](https://astilba.com/docs/agents/mcp.md) — MCP Server connection and usage guide.

Clients that control request headers can instead request the ordinary page URL with `Accept: text/markdown`. Prefer an individual page when the task is narrow; it consumes less context than a combined documentation set.

## Choose static text or MCP

Use an LLMs.txt file when a client works best with one ordinary HTTP response or cannot configure remote tools. Use the [MCP Server](https://astilba.com/docs/agents/mcp/) at `https://astilba.com/docs/mcp` when the client supports Streamable HTTP and benefits from targeted search, resource discovery, and bounded page reads.

Give a compatible coding agent this instruction to connect the public documentation skill and MCP endpoint:

```text
Fetch https://astilba.com/docs/agent-setup/prompt.md and follow its instructions.
```

Neither approach installs an Astilba package or grants access to an Astilba account.

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
| [`/llms.txt`](https://docs.astilba.com/llms.txt) | The client needs a small index that links to the available documentation sets. |
| [`/llms-small.txt`](https://docs.astilba.com/llms-small.txt) | Context is limited and an abridged copy of the documentation is sufficient. |
| [`/llms-full.txt`](https://docs.astilba.com/llms-full.txt) | The client can accept the complete published documentation in one response. |
| [`/_llms-txt/astilba-cache.txt`](https://docs.astilba.com/_llms-txt/astilba-cache.txt) | The task concerns only Astilba Cache and does not need site-wide material. |

The generated files are snapshots of the current deployment. Fetch them again when current behavior or release status matters.

## Access one page

Every published documentation page is also available as Markdown. Replace the trailing slash in a documentation URL with `.md`:

- [`/cache/overview.md`](https://docs.astilba.com/cache/overview.md) — Cache overview and release context.
- [`/cache/api-reference.md`](https://docs.astilba.com/cache/api-reference.md) — Cache API reference.
- [`/agents/mcp.md`](https://docs.astilba.com/agents/mcp.md) — MCP Server connection and usage guide.

Clients that control request headers can instead request the ordinary page URL with `Accept: text/markdown`. Prefer an individual page when the task is narrow; it consumes less context than a combined documentation set.

## Choose static text or MCP

Use an LLMs.txt file when a client works best with one ordinary HTTP response or cannot configure remote tools. Use the [MCP Server](https://docs.astilba.com/agents/mcp/) at `https://docs.astilba.com/mcp` when the client supports Streamable HTTP and benefits from targeted search, resource discovery, and bounded page reads.

Give a compatible coding agent this instruction to connect the public documentation skill and MCP endpoint:

```text
Fetch https://docs.astilba.com/agent-setup/prompt.md and follow its instructions.
```

Neither approach installs an Astilba package or grants access to an Astilba account.

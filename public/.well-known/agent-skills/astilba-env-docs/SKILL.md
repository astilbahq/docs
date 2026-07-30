---
name: "astilba-env-docs"
description: "Consult Astilba's public Env documentation to integrate the 0.1 configuration contract compiler without weakening browser, server, or lifecycle boundaries."
---

# Astilba Env documentation

Use this skill when a question concerns `@astilba/env`, its declaration builders, generated modules, lifecycle model, browser bootstrap protocol, framework wiring, or migration from `next-dynamic-env`.

## Read the public sources

1. When the client supports remote Streamable HTTP MCP, connect to the public, read-only endpoint at `https://astilba.com/docs/mcp`. Use `search_docs` to find focused pages and read the linked Markdown resources; `read_doc` provides bounded chunks when the client does not expose resources directly.
2. Otherwise, start with the [Env document set](https://astilba.com/docs/_llms-txt/astilba-env.txt) when the question spans several topics.
3. When the question is focused, follow the relevant canonical page link in that document set and use the page-specific Markdown alternate it advertises.
4. Use [Configure a Node application](https://astilba.com/docs/env/quickstart.md) for a first integration.
5. Use [Lifecycles and projections](https://astilba.com/docs/env/lifecycles-and-projections.md) to decide when and where a value may be resolved.
6. Use [Declaration reference](https://astilba.com/docs/env/declaration-reference.md) for builders, codecs, consumers, targets, and rules.
7. Use [Deliver browser configuration](https://astilba.com/docs/env/browser-delivery.md) for endpoint, loader, build-value, failure, and Vite-boundary guidance.
8. Use [CLI reference](https://astilba.com/docs/env/cli-reference.md) for generation, target checking, planning, machine formats, and exit statuses.
9. Check [Release and support](https://astilba.com/docs/env/release-and-support.md) before claiming a package, runtime, framework adapter, or compatibility guarantee is supported.
10. Use [Migrate from next-dynamic-env](https://astilba.com/docs/env/migrate-from-next-dynamic-env.md) for App Router, Pages Router, validation, and intentional non-compatibility guidance.

## Keep the public-alpha boundary explicit

- Treat `@astilba/env` 0.1.0 as a public alpha, not a stable compatibility promise.
- Keep browser and server generated modules physically separate.
- Do not invent a hosted control plane, secret store, `.env` loader, inline-script transport, or `@astilba/env/next` export.
- Treat framework routing, startup, endpoint authentication, and response headers as application responsibilities.
- Use inert same-origin JSON for browser deployment and request values; responses that vary by request require `Cache-Control: private, no-store`.

## Answer from evidence

- Prefer the narrowest public page that directly supports the answer.
- Use the canonical URL in each Markdown file's frontmatter when citing a page.
- Distinguish build, deployment, and request values.
- Distinguish generated server targets from generated public browser projections.
- Say when the public docs do not establish an answer. Do not convert alpha intentions into stable guarantees.

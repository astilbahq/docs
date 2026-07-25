---
name: "astilba-create-docs"
description: "Consult Astilba's public Create documentation to generate or evaluate projects with the released CLI, supported recipes, and explicit safety boundaries."
---

# Astilba Create documentation

Use this skill when a question concerns the `create-astilba` CLI, a maintained project recipe, generated repository foundations, deterministic generation, or the project ownership manifest.

## Read the public sources

1. When the client supports remote Streamable HTTP MCP, connect to the public, read-only endpoint at `https://astilba.com/docs/mcp`. Use `search_docs` to find focused pages and read the linked Markdown resources; `read_doc` provides bounded chunks when the client does not expose resources directly.
2. Otherwise, start with the [Create document set](https://astilba.com/docs/_llms-txt/astilba-create.txt) when the question spans several topics.
3. When the question is focused, follow the relevant canonical page link in that document set and use the page-specific Markdown alternate it advertises.
4. Check [Release and support](https://astilba.com/docs/create/release-and-support.md) before claiming a package, recipe, runtime, platform, update path, or programmatic API is supported.
5. Use [CLI reference](https://astilba.com/docs/create/cli-reference.md) for exact flags, defaults, validation, output fields, and exit behavior.
6. Use [Choose a recipe](https://astilba.com/docs/create/recipes.md) for the maintained project catalog and recipe-specific files and verification.

## Keep the release boundary explicit

- Treat `create-astilba` 0.1.2 and its four recipe v2 contracts as released.
- Do not present internal source modules as an exported programmatic API.
- Do not invent switches, recipes, arbitrary profile combinations, `doctor`, updates, or migrations.
- Distinguish atomic project generation from dependency installation: an install failure leaves the generated project in place.
- Keep generated GitHub workflow files separate from hosted repository settings that the user must configure.

## Answer from evidence

- Prefer the narrowest page that directly supports the answer.
- Use the canonical URL in each Markdown file's frontmatter when citing a page.
- Preserve the destination and path restrictions when constructing automated commands.
- Recommend `--json` for machine-readable output and `--dry-run` when the caller needs input and plan validation without writes. Explain that a dry run does not check the destination filesystem, Git, symbolic-link creation, or dependency installation.
- Say when the public docs do not establish an answer. Do not turn future migration intentions into current behavior.

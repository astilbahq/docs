---
title: Create
description: Generate a verified TypeScript project from one maintained Astilba recipe.
tableOfContents: false
prev: false
next: false
---

Astilba Create generates a complete TypeScript project from a small catalog of maintained recipes. It writes the application starting point, pinned toolchain, verification scripts, GitHub workflows, repository guidance, and an ownership manifest in one deterministic operation.

`create-astilba` 0.1.2 is available on npm. Its supported public interface is the command-line tool:

```sh
npm create astilba@latest
```

## Choose your next step

| Goal | Start here |
| --- | --- |
| Decide whether Create fits | [Overview](/docs/create/overview/) |
| Generate and verify a project | [Create your first project](/docs/create/quickstart/) |
| Compare the four maintained starting points | [Choose a recipe](/docs/create/recipes/) |
| Run Create in CI or an agent workflow | [Automate project creation](/docs/create/automation/) |
| Understand its failure and filesystem boundaries | [Deterministic generation](/docs/create/deterministic-generation/) |
| Interpret `.astilba/project.json` | [Project manifest](/docs/create/project-manifest/) |
| Look up every option and default | [CLI reference](/docs/create/cli-reference/) |
| Check the exact supported release surface | [Release and support](/docs/create/release-and-support/) |

If this is your first visit, use the quickstart. If you are integrating Create into automation, read the automation guide and deterministic-generation model together.

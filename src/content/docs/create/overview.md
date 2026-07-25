---
title: Overview
description: Understand what Astilba Create generates, what it guarantees, and where its responsibility ends.
---

Astilba Create turns a named recipe and a small set of project metadata into an independent TypeScript repository. Use it when you want a maintained starting point with build, test, lint, dependency, security, and repository conventions already connected.

The current release is `create-astilba` 0.2.0. It supports four recipe v2 contracts:

- `typescript-library`
- `react-vite-spa`
- `astro-static-site`
- `cloudflare-worker-service`

Run the interactive command to begin:

```sh
npm create astilba@latest
```

## Decide whether Create fits

| You want to… | Fit |
| --- | --- |
| Start one of the four supported TypeScript project kinds | This is the intended use case. |
| Reproduce a project from explicit inputs in automation | Use non-interactive flags with `--json` and, when appropriate, `--dry-run`. |
| Begin with exact dependencies and verification workflows | Every recipe pins its toolchain, packages, and GitHub Actions. |
| Create a repository with no template ancestry | Git initialization creates a fresh `main` branch and does not copy Astilba's commit history. |
| Add arbitrary framework, database, authentication, or deployment combinations | Not yet. Create supports complete named recipes, not an unverified feature matrix. |
| Merge generated files into an existing directory | Not supported. The destination must not already exist. |
| Update or repair an existing generated project | Not in 0.2.0. `doctor` and migration tooling are future work. |
| Import a programmatic generator API | Not supported. The npm package exports its CLI and package metadata, not its internal TypeScript modules. |

## Start from a complete recipe

Each recipe supplies project code and the engineering foundation around it:

- exact Node.js, pnpm, dependency, and GitHub Action versions;
- strict TypeScript;
- Ultracite with Oxfmt and Oxlint;
- Vitest and Knip;
- a frozen-lockfile verification matrix;
- Actionlint, Zizmor, OSV-Scanner, PR-title, CodeQL, and dependency-review workflows;
- Renovate with a three-day minimum release age;
- issue forms, pull-request, security, contribution, and repository-setting guidance; and
- `.astilba/project.json`, which records recipe and file ownership evidence.

The generated workflow files do not configure GitHub repository settings for you. After you publish the repository, follow its generated `docs/repository-settings.md` checklist.

## Understand the guarantees and costs

| Guarantee | Cost or boundary |
| --- | --- |
| The same Create version, recipe, and metadata produce the same planned project files. | Change the generator version, recipe version, or inputs and the plan may change. Fresh `.git` metadata is not part of the byte-for-byte file contract. |
| Generation does not merge through collisions. | The destination must be absent; generated output paths must be unique and portable. |
| A partial staging tree is never presented as a complete project. | Create stages beside the destination and publishes only after file, link, mode, and optional Git initialization succeed. |
| Ambient Git configuration cannot inject hooks or templates. | Git initialization runs with isolated global, system, template, and `GIT_*` settings. |
| Generated application code becomes yours immediately. | Create records seeded files but does not claim permission to overwrite them later. |
| Recipe maintenance covers the complete project contract. | The catalog stays deliberately small; optional capabilities are added only with their development and verification paths. |

Dependency installation happens after the complete project tree is published. If `pnpm install` fails, Create preserves the generated project and tells you to resolve the package-manager error and run the install again.

## Choose a path

| You want to… | Continue with |
| --- | --- |
| Generate a project interactively | [Create your first project](/docs/create/quickstart/) |
| Select the right maintained starting point | [Choose a recipe](/docs/create/recipes/) |
| Run without prompts | [Automate project creation](/docs/create/automation/) |
| Audit filesystem and failure behavior | [Deterministic generation](/docs/create/deterministic-generation/) |
| Understand future migration evidence | [Project manifest](/docs/create/project-manifest/) |
| Confirm what 0.2.0 supports | [Release and support](/docs/create/release-and-support/) |

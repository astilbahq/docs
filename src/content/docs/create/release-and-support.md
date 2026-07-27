---
title: Release and support
description: Check the exact package, runtime, recipe, platform, and verification surface supported by Astilba Create 0.3.0.
---

`create-astilba` 0.3.0 is published on npm from the public [`astilbahq/create`](https://github.com/astilbahq/create) repository. The source release is tagged [`v0.3.0`](https://github.com/astilbahq/create/tree/v0.3.0).

## Supported public surface

| Surface | 0.3.0 status |
| --- | --- |
| Interactive CLI | Recipe-first questionnaire with validated review and per-field editing |
| Non-interactive CLI | Released |
| Versioned recipe catalog | Schema version 1 through `--catalog --json` |
| Versioned JSON output | Schema version 1 |
| `--dry-run` planning | Released |
| `typescript-library` | Recipe version 2 |
| `react-vite-spa` | Recipe version 2 |
| `astro-static-site` | Recipe version 2 |
| `cloudflare-worker-service` | Recipe version 2 |
| Project manifest | Schema version 1 |
| Programmatic TypeScript API | Not exported by the npm package |
| Update, migration, or `doctor` commands | Not shipped |
| Arbitrary recipe composition | Not supported |

The npm export map exposes package metadata only. Internal generator modules in the source repository are implementation details and are not a supported import path.

Create 0.3.0 adds a versioned, non-interactive recipe catalog and its strict JSON Schema. All released recipe IDs, recipe versions, lockfiles, and output fingerprints remain unchanged from 0.2.0.

Planning, generation, and optional dependency installation remain separate interactive phases. Human success and recovery output distinguishes a failure that committed no generated files, an incomplete publication with its marker, and a complete project whose installation or terminal reporting needs attention. The non-interactive creation flags, exit codes, and creation JSON schema version remain compatible with 0.1.2.

## Runtime requirements

| Requirement | Supported value |
| --- | --- |
| Create CLI runtime | Node.js 22.18.0 or later |
| Generated project package manager | pnpm 11.10.0 |

You invoke Create through npm, but generated projects use pnpm. With `--install`, Create uses the `pnpm` executable only when it reports version 11.10.0. Otherwise, Create asks Corepack for `pnpm@11.10.0`.

Generated verification runs on the minimum Node.js release and the current supported major recorded by Create. In 0.3.0, those lanes are Node.js 22.18.0 and 24.18.0.

## Platform boundary

Generated paths are restricted to a portable ASCII subset and checked for Windows device names and case-insensitive collisions.

Every recipe creates `CLAUDE.md` as a symbolic link to `AGENTS.md`. Windows therefore requires Developer Mode or an elevated shell. If the filesystem refuses the link, Create stops in staging and does not publish a partial project. Before cloning a generated repository on Windows, enable symbolic-link support and configure Git to preserve symbolic links.

## Release evidence

The Create repository verifies more than its own unit tests:

- `pnpm verify` runs Ultracite, TypeScript, Vitest, Knip, and the package build;
- `pnpm test:consumers` generates, installs, and runs `pnpm verify` in every recipe as an independent project;
- `pnpm test:package` packs the actual npm tarball, verifies its contents and executable, installs it in a clean temporary consumer, generates all four recipes with JSON output, checks each manifest's schema URL and recipe identity, and verifies each project;
- the on-demand published-package acceptance workflow installs an exact npm version on Linux, macOS, and Windows, follows the public CLI path, checks its catalog and side-effect-free dry run, verifies the generated manifest and agent-instruction link, and runs the generated project's own verification;
- CI repeats recipe consumers on the supported Node.js lanes;
- a Windows packed-CLI smoke test exercises symbolic-link creation;
- Actionlint and Zizmor audit the emitted GitHub workflows; and
- OSV-Scanner, CodeQL, and dependency review run against the Create source repository.

The packed npm artifact contains the license, README, package metadata, compiled `dist` files, the public project-manifest and catalog schemas, and the recipe contract metadata and canonical lockfiles needed to verify generation.

## Publication evidence

The [`v0.3.0` GitHub Release](https://github.com/astilbahq/create/releases/tag/v0.3.0) ran the checked-in release workflow. It verified that the release tag pointed to `main` and matched the package version, rebuilt and checked the package, and published through a protected GitHub environment with npm trusted publishing.

The [`create-astilba@0.3.0` npm record](https://www.npmjs.com/package/create-astilba/v/0.3.0) includes a provenance attestation that identifies the public source repository and GitHub Actions release workflow.

After publication, the [`create-astilba@0.3.0` acceptance run](https://github.com/astilbahq/create/actions/runs/30172510973) passed its Linux Astro, macOS TypeScript library, and Windows Cloudflare Workers journeys against the exact public package. These representative cross-platform journeys complement the complete recipe matrix in the ordinary source and packed-package tests; they do not claim every recipe-and-platform combination.

## Responsibility after generation

Create verifies the generated repository files, but it cannot apply hosted settings. You must follow the generated `docs/repository-settings.md` after pushing to GitHub.

You also own product-specific work after generation:

- choose and configure deployment infrastructure;
- provision secrets and external services;
- replace seeded example code;
- decide repository visibility and publishing policy; and
- keep project-specific capabilities tested.

The Worker recipe includes Wrangler development, type-generation, dry-run build, and deployment commands. The Astro and React recipes deliberately do not choose a hosting provider. The library recipe supplies package checks but does not publish for you.

## Deliberate omissions

Create 0.3.0 does not include optional Panda CSS, monitoring, browser testing, authentication, databases, or general deployment automation. These are not hidden flags or parked public recipes.

Future repair and update tooling is intended to use explicit authored migrations and the manifest's ownership evidence. It will not regenerate over an existing repository or silently mutate a default branch.

Report generator defects or recipe regressions in the public [Create issue tracker](https://github.com/astilbahq/create/issues).

---
title: Release and support
description: Check the exact package, runtime, recipe, platform, and verification surface supported by Astilba Create 0.1.0.
---

`create-astilba` 0.1.0 is published on npm from the public [`astilbahq/create`](https://github.com/astilbahq/create) repository. The source release is tagged [`v0.1.0`](https://github.com/astilbahq/create/tree/v0.1.0).

## Supported public surface

| Surface | 0.1.0 status |
| --- | --- |
| Interactive CLI | Released |
| Non-interactive CLI | Released |
| Versioned JSON output | Schema version 1 |
| `--dry-run` planning | Released |
| `typescript-library` | Recipe version 1 |
| `react-vite-spa` | Recipe version 1 |
| `astro-static-site` | Recipe version 1 |
| `cloudflare-worker-service` | Recipe version 1 |
| Project manifest | Schema version 1 |
| Programmatic TypeScript API | Not exported by the npm package |
| Update, migration, or `doctor` commands | Not shipped |
| Arbitrary recipe composition | Not supported |

The npm export map exposes package metadata only. Internal generator modules in the source repository are implementation details and are not a supported import path.

## Runtime requirements

| Requirement | Floor |
| --- | --- |
| Node.js | 22.18.0 or later |
| pnpm | 11.10.0 or later |

You invoke Create through npm, but generated projects use pnpm. With `--install`, Create uses the `pnpm` executable or falls back to `corepack pnpm` only when that executable is missing.

Generated verification runs on the minimum Node.js release and the current supported major recorded by Create. In 0.1.0, those lanes are Node.js 22.18.0 and 24.18.0.

## Platform boundary

Generated paths are restricted to a portable ASCII subset and checked for Windows device names and case-insensitive collisions.

Every recipe creates `CLAUDE.md` as a symbolic link to `AGENTS.md`. Windows therefore requires Developer Mode or an elevated shell. If the filesystem refuses the link, Create stops in staging and does not publish a partial project. Before cloning a generated repository on Windows, enable symbolic-link support and configure Git to preserve symbolic links.

## Release evidence

The Create repository verifies more than its own unit tests:

- `pnpm verify` runs Ultracite, TypeScript, Vitest, Knip, and the package build;
- `pnpm test:consumers` generates, installs, and runs `pnpm verify` in every recipe as an independent project;
- `pnpm test:package` packs the actual npm tarball, verifies its contents and executable, installs it in a clean temporary consumer, generates all four recipes with JSON output, checks each manifest's schema URL and recipe identity, and verifies each project;
- CI repeats recipe consumers on the supported Node.js lanes;
- a Windows packed-CLI smoke test exercises symbolic-link creation;
- Actionlint and Zizmor audit the emitted GitHub workflows; and
- OSV-Scanner, CodeQL, and dependency review run against the Create source repository.

The packed npm artifact is limited to the license, README, package metadata, and compiled `dist` files.

## Configured publication path

When a GitHub Release is published, the repository's release workflow is configured to verify that its tag points to `main` and matches the package version before publishing through a protected GitHub environment with npm trusted publishing and provenance.

This is the configured path for future releases. The npm record for 0.1.0 does not include a provenance attestation, so this documentation does not attribute that first publication to the workflow.

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

Create 0.1.0 does not include optional Panda CSS, monitoring, browser testing, authentication, databases, or general deployment automation. These are not hidden flags or parked public recipes.

Future repair and update tooling is intended to use explicit authored migrations and the manifest's ownership evidence. It will not regenerate over an existing repository or silently mutate a default branch.

Report generator defects or recipe regressions in the public [Create issue tracker](https://github.com/astilbahq/create/issues).

---
title: Automate project creation
description: Run Astilba Create without prompts and consume its versioned JSON result safely.
---

Supply every required input explicitly, request JSON output, and use the process exit code as the success boundary.

## Run without prompts

A non-interactive run requires a destination, recipe, description, and GitHub owner:

```sh
npm create astilba@latest -- my-project \
  --recipe react-vite-spa \
  --description "A useful application." \
  --github-owner example \
  --package-name @example/my-project \
  --no-install \
  --json
```

`--json` never prompts, even when the terminal is interactive. It does not make missing inputs optional.

The destination name supplies these defaults:

| Field | Default |
| --- | --- |
| `--project-name` | normalized destination basename |
| `--package-name` | normalized destination basename |
| `--github-repo` | normalized destination basename |
| Git initialization | enabled |
| Dependency installation | disabled in non-interactive mode |

Use `--install` when the workflow should run `pnpm install` after generation. Use `--no-git` when Git is intentionally unavailable.

## Plan without writing

Add `--dry-run` to resolve inputs and construct the complete generation plan without creating the destination, initializing Git, or installing dependencies:

```sh
npm create astilba@latest -- my-project \
  --recipe astro-static-site \
  --description "A useful static site." \
  --github-owner example \
  --dry-run \
  --json
```

The result uses `"action":"plan"` and `"installed":false`. A successful write uses `"action":"create"`.

The JSON plan lists every regular-file and symbolic-link path in deterministic order. It does not return file contents or modes.

A dry run validates metadata, the portable destination argument, recipe rules, generated paths, collisions, and link targets. It does not inspect the destination filesystem or exercise parent-directory preparation, Git, symbolic-link creation, or dependency installation. Run actual creation in the target environment to check that the destination is absent, any existing parent ancestry contains no symbolic links, missing parent directories can be created, and those external operations are available.

## Consume JSON output

Successful creation writes one JSON object to standard output:

```json
{
  "action": "create",
  "destination": "/absolute/path/to/my-project",
  "files": [".astilba/project.json", ".editorconfig", "package.json"],
  "installed": false,
  "ok": true,
  "recipe": "react-vite-spa",
  "schemaVersion": 1,
  "symlinks": ["CLAUDE.md"]
}
```

The actual `files` array contains every planned regular file in deterministic path order. The shortened array above only illustrates the response shape.

On an ordinary error with `--json`, Create writes this shape to standard output and exits with status `1`:

```json
{
  "destination": "/absolute/path/to/my-project",
  "error": {
    "code": "INSTALLATION_FAILED",
    "message": "The actionable error message.",
    "phase": "installation"
  },
  "ok": false,
  "projectCreated": true,
  "schemaVersion": 1
}
```

`destination` is present when Create resolved one. `error.code` is one of `CANCELLED`, `GENERATION_FAILED`, `INSTALLATION_FAILED`, `INVALID_INPUT`, `PACKAGE_MANAGER_UNAVAILABLE`, or `UNEXPECTED_ERROR`. `CANCELLED` is the status-130 exception; the other codes use status `1`. `error.phase` is `input`, `generation`, `installation`, or `unknown`.

Without `--json`, ordinary errors go to standard error with an `Error:` prefix. Cancellation and process interruption exit with status `130` in every output mode.

Always check both `schemaVersion` and `ok` before reading other fields. Branch on `error.code`, `error.phase`, and `projectCreated`; treat `error.message` as human-readable context.

## Discover the released recipes

Read the versioned recipe catalog when automation needs to offer or validate the released choices:

```sh
npm create astilba@latest -- --catalog --json
```

This command does not prompt or write project files. Check `schemaVersion`, `generator.version`, and `ok` before reading `recipes`. Each recipe entry exposes its stable ID, recipe version, label, and description. The npm package includes the strict catalog schema at `schemas/catalog-v1.json`.

Use the catalog as discovery metadata, not as a dependency or generated-file manifest. It deliberately excludes internal profiles, package pins, and implementation details.

## Distinguish generation from installation

Create publishes the complete project tree before it runs dependency installation. This gives automation two distinct failure boundaries:

1. If generation fails, Create does not present the destination as complete. A rare failed publication rollback preserves `.astilba-create-incomplete`.
2. If installation fails, the project remains at the destination and the command exits with an error explaining how to rerun `pnpm install`.

Choose `--no-install` when your workflow wants to inspect, archive, or enter the generated tree before resolving dependencies. It is also the default outside the interactive questionnaire.

CLI output schema version 1 deliberately remains unchanged in Create 0.3.0. It reports whether the project was created, but it does not expose the internal distinction between an unchanged destination and an incomplete publication: both have `projectCreated: false`. When automatic recovery must be unambiguous, use `--no-install`, branch on the structured error fields, and never accept a destination that contains `.astilba-create-incomplete`.

## Pin when reproducibility requires it

`@latest` selects the npm release current at execution time. If an automation contract must stay on one generator release, invoke that exact package version:

```sh
npm create astilba@0.3.0 -- my-project \
  --recipe typescript-library \
  --description "A useful library." \
  --github-owner example \
  --no-install \
  --json
```

The generated manifest records the selected generator and recipe versions. Commit it with the project.

## Inspect catalog, help, and version as JSON

The informational commands support machine-readable output:

```sh
npm create astilba@latest -- --catalog --json
npm create astilba@latest -- --help --json
npm create astilba@latest -- --version --json
```

Catalog returns `command`, `generator`, `ok`, `recipes`, and its own `schemaVersion`. Help returns `command`, `ok`, `schemaVersion`, and `usage`. Version returns `command`, `ok`, `schemaVersion`, and `version`.

See [CLI reference](/docs/create/cli-reference/) for every option and validation rule, and [Deterministic generation](/docs/create/deterministic-generation/) for the filesystem transaction boundary.

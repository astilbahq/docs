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

A dry run validates metadata, the portable destination argument, recipe rules, generated paths, collisions, and link targets. It does not inspect the destination filesystem or exercise Git, symbolic-link creation, or dependency installation. Run actual creation in the target environment to check that the destination is absent, its parent exists without symbolic-link ancestors, and those external operations are available.

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

On an error with `--json`, Create writes this shape to standard output and exits with status `1`:

```json
{
  "error": {
    "message": "The actionable error message."
  },
  "ok": false,
  "schemaVersion": 1
}
```

Without `--json`, errors go to standard error with an `Error:` prefix. Interactive cancellation exits with status `130`.

Always check both `schemaVersion` and `ok` before reading other fields. Version 1 does not include nested error codes; treat `error.message` as human-readable context, not a stable branch key.

## Distinguish generation from installation

Create publishes the complete project tree before it runs dependency installation. This gives automation two distinct failure boundaries:

1. If generation fails, Create does not publish a complete destination.
2. If installation fails, the project remains at the destination and the command exits with an error explaining how to rerun `pnpm install`.

Choose `--no-install` when your workflow wants to inspect, archive, or enter the generated tree before resolving dependencies. It is also the default outside the interactive questionnaire.

## Pin when reproducibility requires it

`@latest` selects the npm release current at execution time. If an automation contract must stay on one generator release, invoke that exact package version:

```sh
npm create astilba@0.1.0 -- my-project \
  --recipe typescript-library \
  --description "A useful library." \
  --github-owner example \
  --no-install \
  --json
```

The generated manifest records the selected generator and recipe versions. Commit it with the project.

## Inspect help and version as JSON

Both informational commands support machine-readable output:

```sh
npm create astilba@latest -- --help --json
npm create astilba@latest -- --version --json
```

Help returns `command`, `ok`, `schemaVersion`, and `usage`. Version returns `command`, `ok`, `schemaVersion`, and `version`.

See [CLI reference](/docs/create/cli-reference/) for every option and validation rule, and [Deterministic generation](/docs/create/deterministic-generation/) for the filesystem transaction boundary.

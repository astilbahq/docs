---
title: CLI reference
description: Look up Astilba Create commands, inputs, defaults, validation rules, output, and exit behavior.
---

The supported public interface of `create-astilba` 0.3.0 is its command-line tool.

## Usage

```text
npm create astilba@latest
npm create astilba@latest -- <directory> --recipe <recipe> [options]
npm create astilba@latest -- --catalog
npx --yes create-astilba@latest --catalog --json
```

Use the first form for the interactive questionnaire. In the other npm forms, `--` tells npm to forward the remaining arguments to Create. Use the direct `npx` form whenever standard output must contain only the JSON object; npm's `create` wrapper adds its own lifecycle lines.

## Recipes

| Identifier | Starting point |
| --- | --- |
| `typescript-library` | ESM TypeScript library |
| `react-vite-spa` | Client-rendered React and Vite application |
| `astro-static-site` | Statically rendered Astro site |
| `cloudflare-worker-service` | Cloudflare Worker service |

Recipe identifiers are stable. See [Choose a recipe](/docs/create/recipes/) for generated files and verification behavior.

## Options

| Option | Short | Meaning |
| --- | --- | --- |
| `--catalog` | — | List the released recipes without starting the questionnaire or writing project files. Add `--json` for versioned machine-readable output. |
| `--description <text>` | — | Project description. Required outside the interactive questionnaire. |
| `--github-owner <owner>` | — | GitHub account that will own the repository. Required outside the interactive questionnaire. |
| `--github-repo <name>` | — | GitHub repository name. Defaults to the normalized destination basename. |
| `--package-name <name>` | — | npm package name. Defaults to the normalized destination basename. |
| `--project-name <name>` | — | Project name. Defaults to the normalized destination basename. |
| `--recipe <recipe>` | `-r` | Stable recipe identifier. Required outside the interactive questionnaire. |
| `--git` / `--no-git` | — | Enable or disable fresh Git initialization. Defaults to enabled. |
| `--install` / `--no-install` | — | Enable or disable dependency installation. Questionnaire default: enabled. Prompt-free default: disabled. |
| `--dry-run` | — | Validate inputs and construct the generation plan without writing, initializing Git, or installing. JSON output returns the planned file and link paths, not their contents or modes. |
| `--json` | — | Emit versioned machine-readable output. This mode never prompts. Invoke `create-astilba` directly through `npx` when a machine will parse standard output. |
| `--yes` | `-y` | Skip the final interactive confirmation. It does not supply missing required inputs. |
| `--version` | `-v` | Print the installed Create version. |
| `--help` | `-h` | Print usage, recipes, and options. |

Provide at most one destination directory.

## Prompt-free requirements

Create skips the questionnaire when standard input or output is not a terminal, when you pass `--json`, or when you provide every required input explicitly. A prompt-free run requires:

- one destination;
- `--recipe`;
- `--description`; and
- `--github-owner`.

Create infers project, package, and repository names from the destination when you omit their explicit options.

The inference lowercases the destination basename, replaces runs of non-alphanumeric characters with `-`, trims leading and trailing hyphens, and limits the result to 63 characters. The result must include at least one letter or digit.

## Metadata validation

| Input | Validation |
| --- | --- |
| Description | 1–280 characters; no leading or trailing whitespace; no control or formatting characters |
| GitHub owner | 1–39 characters; letters, digits, and internal hyphens; must begin and end with a letter or digit |
| GitHub repository | 1–100 characters; letters, digits, dots, underscores, and hyphens; must begin and end with a letter or digit |
| Package name | 1–214 characters; supported lowercase npm package name, optionally scoped |
| Project name | 1–100 characters; lowercase letters, digits, dots, underscores, and hyphens; must begin and end with a letter or digit |

Create validates explicit and inferred values before planning output.

The `cloudflare-worker-service` recipe further restricts the project name to at most 63 lowercase letters, digits, or hyphens, with no leading or trailing hyphen. This applies whether the value comes from `--project-name` or the destination basename.

## Destination validation

The destination argument must be a normalized portable relative path. It cannot contain traversal, backslashes, `.git`, Windows device names, control or formatting characters, non-ASCII path segments, trailing spaces or periods, or Windows-forbidden filename characters.

For actual creation, the destination must not exist. Create makes missing parent directories, while rejecting symbolic links or non-directory entries in the existing ancestry.

`--dry-run` validates the destination argument and generated output plan, but it does not inspect the destination filesystem. It therefore does not prove that the destination is absent, existing parent ancestry is safe, missing parents can be created, Git or link creation will work, or dependency installation is available.

See [Deterministic generation](/docs/create/deterministic-generation/) for output collision checks, staging, rollback, and the incomplete marker.

## Human-readable output

Interactive terminals report planning, generation, and optional dependency installation as separate phases. A successful non-TTY run without `--json` prints the same final state and next step without terminal animation:

```text
Created React + Vite application at /absolute/path/to/my-project. Dependencies were not installed.
Next: open /absolute/path/to/my-project, run pnpm install --frozen-lockfile, then run pnpm verify.
```

A dry run begins with `Planned`. A successful install instead reports `Dependencies installed` and directs you to `pnpm verify`.

Ordinary errors print to standard error as `Error: <message>` and exit with status `1`. Recovery text distinguishes these filesystem outcomes:

- no generated files were committed to the destination;
- publication is incomplete and the `.astilba-create-incomplete` marker remains; or
- the project was created, but installation or terminal reporting needs attention.

Cancellation and process interruption exit with status `130` in every output mode. If cancellation arrives after publication, recovery output still says that the project exists and whether dependency installation needs to be completed.

## JSON output

`--json` writes one JSON object to standard output.

Invoke the package directly to keep npm wrapper output out of that stream:

```sh
npx --yes create-astilba@latest my-project \
  --recipe react-vite-spa \
  --description "A useful application." \
  --github-owner example \
  --no-install \
  --json
```

Successful plan or creation:

| Field | Type | Meaning |
| --- | --- | --- |
| `action` | `"plan"` or `"create"` | Whether `--dry-run` stopped before writing |
| `destination` | string | Absolute resolved destination |
| `files` | string array | Every planned regular-file path in deterministic order |
| `installed` | boolean | Whether dependency installation completed |
| `ok` | `true` | Success discriminator |
| `recipe` | string | Selected recipe identifier |
| `schemaVersion` | `1` | CLI output schema version |
| `symlinks` | string array | Every planned symbolic-link path |

Error:

| Field | Type | Meaning |
| --- | --- | --- |
| `destination` | string, optional | Absolute resolved destination when one is available |
| `error.code` | string | Stable failure category |
| `error.message` | string | Human-readable actionable error |
| `error.phase` | string | `input`, `generation`, `installation`, or `unknown` |
| `ok` | `false` | Error discriminator |
| `projectCreated` | boolean | Whether a complete project was published |
| `schemaVersion` | `1` | CLI output schema version |

`error.code` is one of `CANCELLED`, `GENERATION_FAILED`, `INSTALLATION_FAILED`, `INVALID_INPUT`, `PACKAGE_MANAGER_UNAVAILABLE`, or `UNEXPECTED_ERROR`. `CANCELLED` maps to status `130`; the other codes map to status `1`. When `projectCreated` is `false`, inspect a resolved destination for `.astilba-create-incomplete` before treating it as unchanged.

## Recipe catalog output

Use the catalog when an interface or automation needs to discover released recipe IDs without duplicating a list:

```sh
npx --yes create-astilba@latest --catalog --json
```

The command does not start the questionnaire or write project files. It emits one newline-terminated JSON object with:

| Field | Type | Meaning |
| --- | --- | --- |
| `command` | `"catalog"` | Catalog result discriminator |
| `generator.name` | `"create-astilba"` | Package that owns the catalog |
| `generator.version` | string | Exact installed Create version |
| `ok` | `true` | Success discriminator |
| `recipes` | array | Stable recipe IDs, recipe versions, labels, and descriptions |
| `schemaVersion` | `1` | Catalog output schema version |

The catalog deliberately omits internal profiles, dependency lists, and implementation details. Its schema version is independent from the generator version and recipe versions. The schema ships in the npm package at `schemas/catalog-v1.json`.

`--help --json` returns `command`, `ok`, `schemaVersion`, and `usage`. `--version --json` returns `command`, `ok`, `schemaVersion`, and `version`.

## Exit status

| Status | Meaning |
| --- | --- |
| `0` | Help, version, catalog, plan, creation, and any requested install completed successfully |
| `1` | Input, planning, generation, Git, dependency-installation, or terminal-reporting error |
| `130` | The operation was cancelled or interrupted |

For a complete automated example, see [Automate project creation](/docs/create/automation/).

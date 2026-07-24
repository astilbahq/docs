---
title: CLI reference
description: Look up Astilba Create commands, inputs, defaults, validation rules, output, and exit behavior.
---

The supported public interface of `create-astilba` 0.1.0 is its command-line tool.

## Usage

```text
npm create astilba@latest
npm create astilba@latest -- <directory> --recipe <recipe> [options]
```

Use the first form for the interactive questionnaire. In the second form, `--` tells npm to forward the remaining arguments to Create.

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
| `--description <text>` | — | Project description. Required outside the interactive questionnaire. |
| `--github-owner <owner>` | — | GitHub account that will own the repository. Required outside the interactive questionnaire. |
| `--github-repo <name>` | — | GitHub repository name. Defaults to the normalized destination basename. |
| `--package-name <name>` | — | npm package name. Defaults to the normalized destination basename. |
| `--project-name <name>` | — | Project name. Defaults to the normalized destination basename. |
| `--recipe <recipe>` | `-r` | Stable recipe identifier. Required outside the interactive questionnaire. |
| `--git` / `--no-git` | — | Enable or disable fresh Git initialization. Defaults to enabled. |
| `--install` / `--no-install` | — | Enable or disable dependency installation. Questionnaire default: enabled. Prompt-free default: disabled. |
| `--dry-run` | — | Validate inputs and construct the generation plan without writing, initializing Git, or installing. JSON output returns the planned file and link paths, not their contents or modes. |
| `--json` | — | Emit versioned machine-readable output. This mode never prompts. |
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
| Description | 1–280 characters; no leading or trailing whitespace; no control characters |
| GitHub owner | 1–39 characters; letters, digits, and internal hyphens; must begin and end with a letter or digit |
| GitHub repository | 1–100 characters; letters, digits, dots, underscores, and hyphens; must begin and end with a letter or digit |
| Package name | 1–214 characters; supported lowercase npm package name, optionally scoped |
| Project name | 1–100 characters; lowercase letters, digits, dots, underscores, and hyphens; must begin and end with a letter or digit |

Create validates explicit and inferred values before planning output.

The `cloudflare-worker-service` recipe further restricts the project name to at most 63 lowercase letters, digits, or hyphens, with no leading or trailing hyphen. This applies whether the value comes from `--project-name` or the destination basename.

## Destination validation

The destination argument must be a normalized portable relative path. It cannot contain traversal, backslashes, `.git`, Windows device names, control or formatting characters, non-ASCII path segments, trailing spaces or periods, or Windows-forbidden filename characters.

For actual creation, the destination must not exist. Its parent directory must exist and must not contain symbolic links in its existing ancestry.

`--dry-run` validates the destination argument and generated output plan, but it does not inspect the destination filesystem. It therefore does not prove that the destination is absent, its parent exists without symbolic-link ancestors, Git or link creation will work, or dependency installation is available.

See [Deterministic generation](/docs/create/deterministic-generation/) for output collision checks, staging, rollback, and the incomplete marker.

## Human-readable output

Interactive terminals receive progress and completion messages. A successful non-TTY run without `--json` prints one summary:

```text
Created React + Vite application at /absolute/path/to/my-project
```

A dry run begins with `Planned`. Errors print to standard error as `Error: <message>` and exit with status `1`.

If dependency installation fails, the destination remains and the message explains how to rerun `pnpm install`.

## JSON output

`--json` writes one JSON object to standard output.

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
| `error.message` | string | Human-readable actionable error |
| `ok` | `false` | Error discriminator |
| `schemaVersion` | `1` | CLI output schema version |

`--help --json` returns `command`, `ok`, `schemaVersion`, and `usage`. `--version --json` returns `command`, `ok`, `schemaVersion`, and `version`.

## Exit status

| Status | Meaning |
| --- | --- |
| `0` | Help, version, plan, creation, and any requested install completed successfully |
| `1` | Input, planning, generation, Git, or dependency-installation error |
| `130` | Interactive prompt or confirmation was cancelled |

For a complete automated example, see [Automate project creation](/docs/create/automation/).

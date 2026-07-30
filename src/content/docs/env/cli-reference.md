---
title: CLI reference
description: Generate Env modules, validate a target, plan contract changes, consume JSON output, and interpret exit statuses.
---

The `astilba-env` command compiles `astilba.env.ts` in the current package. It generates project-owned interfaces, checks current values without exposing them, and compares value-free planning snapshots.

Run it through your package manager:

```sh
pnpm exec astilba-env generate
```

Inside `package.json` scripts, call `astilba-env` directly.

## Command summary

```text
astilba-env generate [--config PATH] [--check] [--json]
astilba-env check --target ID [--config PATH] [--json]
astilba-env plan --base GIT_REF [--config PATH] [--json]
```

Options use a separate value token. `--config=custom.mts` is not accepted.

The default configuration is `astilba.env.ts`. `--config` accepts lowercase `.ts` and `.mts` files. A `.ts` file must be inside an ESM package with `"type": "module"`.

## `generate`

Compile the declaration and replace the owned `.astilba/env/` directory:

```sh
pnpm exec astilba-env generate
```

Generation writes:

- typed server target modules;
- typed browser build or projection modules;
- full and consumer-specific value-free contract JSON;
- `snapshot.json` for planning; and
- `manifest.json` binding the exact generated tree.

When a public browser consumer has build entries, generation reads the corresponding build target names from the current process environment and emits the validated public values into `browser/<consumer>.build.ts`.

Env refuses to replace a generated directory that is malformed, contains symbolic links, has an unsupported format, or contains unowned files. Generated files start with an ownership marker where appropriate; do not edit them manually.

### Check drift

```sh
pnpm exec astilba-env generate --check
```

This compiles the declaration and compares every expected byte without writing. It fails if a file is missing, changed, or unexpected.

Use it as a CI gate:

```json
{
  "scripts": {
    "env:check": "astilba-env generate --check"
  }
}
```

The CI environment must supply any public build values needed to reproduce `.build.ts` modules.

## `check`

Validate one named process target against the current environment:

```sh
pnpm exec astilba-env check --target serverDeployment
```

`check` prints one validity statement. It does not print resolved values. With `--json`, a failure includes redacted diagnostic codes and logical identities:

```json
{
  "command": "check",
  "diagnostics": [
    {
      "code": "ENV_MISSING_VALUE",
      "consumer": "server",
      "entry": "databaseUrl",
      "lifecycle": "deployment"
    }
  ],
  "format": "astilba.env.cli.check/v1",
  "ok": false,
  "target": "serverDeployment"
}
```

The exact diagnostic fields depend on the failure. Values, value fragments, lengths, and hashes are not included.

The CLI cannot validate an `opaque` entry because it has no application schema implementation. Import the target's generated `check(source, schemas)` function instead.

## `plan`

Compare the current declaration with a generated snapshot committed at a Git revision:

```sh
pnpm exec astilba-env plan --base origin/main
```

Env reads `.astilba/env/snapshot.json` from the resolved base commit and compiles the current declaration. It does not execute the historical `astilba.env.ts`.

Plain output tells you whether actions are required. Use `--json` for the value-free impact plan:

```sh
pnpm exec astilba-env plan --base origin/main --json
```

The plan can call for actions such as:

- rebuilding or activating an application artifact;
- adding, reconfiguring, or removing configuration;
- rebuilding an adapter;
- revalidating a target; or
- performing manual or security review.

Confidence is `PROVEN` only when the declared change supports an exact conclusion. Opaque or otherwise unprovable compatibility remains `UNKNOWN`.

`plan` compares declarations and bindings. It does not inspect live provider state, current values, secret-manager contents, or configuration drift outside the generated snapshot.

## `--json`

Add `--json` to any command for one canonical JSON object. Successful results go to standard output. Command and usage errors go to standard error.

Machine formats are versioned independently:

| Command | Success format |
| --- | --- |
| `generate` | `astilba.env.cli.generate/v1` |
| `check` | `astilba.env.cli.check/v1` |
| `plan` | `astilba.env.cli.plan/v1` |
| Any command error | `astilba.env.cli.error/v1` |

Check the `format` field before consuming other fields. Treat a newer or unknown discriminator as unsupported instead of guessing its meaning.

## Exit statuses

| Status | Meaning |
| --- | --- |
| `0` | Command completed successfully. A plan also has no consumer with `UNKNOWN` confidence. |
| `1` | Invalid configuration, stale or invalid generated output, command failure, or a plan with unknown confidence. |
| `2` | Invalid command syntax, target name, configuration extension, or Git reference. |

Do not parse human-readable output for automation. Use `--json`, the versioned format field, and the exit status together.

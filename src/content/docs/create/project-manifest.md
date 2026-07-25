---
title: Project manifest
description: Interpret the version, recipe, digest, field, and symbolic-link evidence in .astilba/project.json.
---

Every generated project includes `.astilba/project.json`. Commit it with the repository: it records which Create and recipe versions produced the tree and what kind of ownership each generated output had at creation time.

The manifest conforms to [the public Create v1 JSON Schema](https://astilba.com/schemas/create/v1.json).

## Read the top-level contract

An abridged manifest looks like this:

```jsonc
{
  "$schema": "https://astilba.com/schemas/create/v1.json",
  "features": [],
  "generator": {
    "name": "create-astilba",
    "version": "0.3.0"
  },
  "ownership": {
    "managed": [
      {
        "path": ".editorconfig",
        "sha256": "a 64-character lowercase hexadecimal digest"
      }
    ],
    "metadata": ".astilba/project.json",
    "seeded": ["README.md", "src/index.ts", "tests/index.test.ts"],
    "structured": [
      {
        "fields": [
          {
            "pointer": "/scripts/build",
            "sha256": "a 64-character lowercase hexadecimal digest"
          }
        ],
        "path": "package.json"
      }
    ],
    "symlinks": [
      {
        "path": "CLAUDE.md",
        "target": "AGENTS.md"
      }
    ]
  },
  "recipe": {
    "id": "typescript-library",
    "version": 2
  },
  "schemaVersion": 1
}
```

The example shortens the ownership arrays and replaces real digests with descriptions. Generated manifests contain the complete arrays and real SHA-256 values.

## Distinguish the versions

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Structure of the manifest itself. Version 1 is documented by the public schema. |
| `generator.version` | Exact `create-astilba` package version that produced the project. |
| `recipe.id` | Permanent identifier for the selected maintained recipe. |
| `recipe.version` | Version of that recipe's output contract. All recipes in Create 0.3.0 use version 2. |
| `features` | Reserved feature list. It is empty in the current schema and release. |

A new generator release does not necessarily imply a new manifest schema or recipe version. Each coordinate changes only when its own contract changes.

## Interpret ownership

### Managed files

`ownership.managed` records each generator-owned configuration file with the SHA-256 digest of its UTF-8 content at generation time.

The digest is evidence, not enforcement. You may edit a managed file. Future migration tooling would have to compare the recorded digest and fail closed when your content no longer matches an expected starting state.

### Metadata

`ownership.metadata` identifies `.astilba/project.json` itself. The manifest does not hash itself because that would create a recursive digest.

### Seeded files

`ownership.seeded` lists application and documentation starting points that become user-owned immediately. Examples include `README.md`, source files, and tests.

Future generator tooling must not assume that these files still resemble their generated form.

### Structured fields

`ownership.structured` divides a JSON file into independently tracked fields. In 0.3.0, that file is `package.json`.

Each `pointer` is an RFC 6901 JSON Pointer. Its digest covers the JSON serialization of that field's original value, not the bytes of the entire file. This allows a future migration to reason about one script or dependency without claiming ownership of unrelated package metadata.

### Symbolic links

`ownership.symlinks` records the link path and its planned target. Generated projects make `AGENTS.md` canonical and link `CLAUDE.md` to it.

The target is recorded as a portable project-relative path. On Windows, creating the link requires Developer Mode or elevated privileges.

## Use the manifest today

Create 0.3.0 does not include an update, migration, or `doctor` command. Today the manifest helps you:

- identify the exact generator and recipe contract;
- audit which files began as managed configuration or user-owned seeds;
- verify original managed content against its digest; and
- preserve future migration evidence when you commit the generated project.

Do not interpret the manifest as permission for a future tool to overwrite changed files. The intended update model is explicit, authored, and fail-closed.

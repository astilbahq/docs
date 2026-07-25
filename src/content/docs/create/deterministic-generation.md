---
title: Deterministic generation
description: Understand Astilba Create's planning, validation, staging, publication, and failure boundaries.
---

Create plans and validates the complete project before it publishes a destination. It rejects ambiguous merges and portable-path hazards instead of guessing how to resolve them.

## Follow the generation sequence

For one generator version, recipe version, and validated metadata, Create follows this sequence:

1. resolve exactly one named recipe and its required internal profiles;
2. validate project metadata and every output declaration;
3. reject file, directory, case-insensitive, and symbolic-link collisions;
4. construct the deterministic manifest and sorted project plan;
5. write files and links into a temporary sibling directory;
6. apply file and directory modes;
7. optionally initialize an isolated Git repository;
8. publish the complete top-level tree into a new destination; and
9. optionally install dependencies in the published project.

`--dry-run` stops after planning and returns the file and link paths without writing anything. It validates the plan, not the target filesystem or external operations.

## Know what deterministic means

The same Create version, recipe, and metadata produce the same planned regular-file bytes, path order, file modes, and symbolic-link targets. The manifest digests are therefore stable for the same plan.

Fresh `.git` internals and an installed `node_modules` tree are outside that byte-for-byte contract. Git still receives a stable structural guarantee: Create starts a new repository on `main`, without template history or an initial commit.

Recipe identifiers and recipe versions are permanent contract coordinates. Updating a recipe requires a new version; it does not silently redefine the recorded v2 output.

## Reject unsafe destinations

The command-line destination must be a normalized portable relative path. Create rejects:

- absolute POSIX or Windows paths;
- `.` or `..` path segments and traversal;
- backslashes;
- `.git` segments;
- Windows device names such as `CON` or `NUL`;
- trailing spaces or periods;
- control or formatting characters;
- non-ASCII path segments; and
- characters that are not portable to Windows.

During actual creation, the resolved destination must not already exist. Its parent must exist, and no existing parent segment may be a symbolic link. Dry runs skip these filesystem checks.

These rules are stricter than the host filesystem because a generated repository should remain portable when checked out elsewhere.

## Reject ambiguous output plans

Before writing, Create rejects:

- two declarations for the same path;
- paths that differ only by letter case;
- a regular file used as another output's parent directory;
- a profile dependency cycle or conflict;
- a symbolic link that collides with another output;
- a symbolic link whose target is not a planned regular file; and
- any recipe output beneath the reserved `.astilba` manifest directory.

Create does not have a generic “merge on collision” rule. Each named recipe must resolve to one internally consistent project.

## Publish only a complete tree

Create stages output in a temporary directory beside the destination. File writing, link creation, permission changes, and optional Git initialization happen there.

Publication creates the destination with an incomplete marker, moves the staged top-level entries, then removes the marker only after every move succeeds. If a move fails, Create attempts to roll all moved entries back:

- when rollback succeeds, it removes the marker and tries to remove the now-empty destination;
- when any rollback also fails, it preserves the incomplete marker so the directory cannot be mistaken for a successful project.

Create never recursively deletes a destination that another process may have changed.

On Windows, `CLAUDE.md` requires symbolic-link permission. Enable Developer Mode or use an elevated shell. If the link cannot be created, staging fails before publication.

## Isolate Git initialization

Git initialization removes ambient `GIT_*` variables and disables global and system configuration. It also supplies an empty temporary template directory.

This prevents a developer's hooks, templates, aliases, or global defaults from modifying the generated repository. Create verifies that `.git` is a real directory and that `HEAD` points to `refs/heads/main`.

## Treat installation as a separate phase

Dependency installation is deliberately outside atomic generation:

- Create uses an installed `pnpm` only when its version exactly matches the generated project's pinned version.
- Otherwise, it asks Corepack for that exact pnpm version before installing.
- A package-manager failure leaves the generated project intact and reports that installation must be retried.

This boundary avoids deleting a valid project because a registry, network, lifecycle script, or local package-manager configuration failed.

## Do not use Create as an updater

Create 0.1.2 only creates a destination that does not exist. It does not regenerate over an existing repository, merge a newer recipe, run `doctor`, or update a default branch.

The [project manifest](/docs/create/project-manifest/) records enough ownership evidence for future explicit migrations, but no migration command is shipped in this release.

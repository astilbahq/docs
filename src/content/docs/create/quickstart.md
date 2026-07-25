---
title: Create your first project
description: Generate, verify, and prepare a new Astilba project for GitHub.
---

Create a project interactively, run its complete local verification command, then apply the generated repository settings after you publish it.

## Check the prerequisites

Use Node.js 22.18.0 or later. Generated projects pin pnpm 11.10.0.

Create initializes Git on a fresh `main` branch by default, so use a Git version that supports `git init --initial-branch` or choose `--no-git`. Dependency installation uses an installed `pnpm` only when its version is exactly 11.10.0. Otherwise, Create asks Corepack for `pnpm@11.10.0`.

## Run the questionnaire

From the parent directory where the new project should live, run:

```sh
npm create astilba@latest
```

The questionnaire asks for:

1. a portable relative destination such as `my-project`;
2. one supported recipe;
3. a short project description;
4. an npm package name;
5. the GitHub owner;
6. whether to initialize Git;
7. whether to install dependencies; and
8. final confirmation.

The directory name supplies the default project name, package name, and GitHub repository name. The interactive flow defaults both Git initialization and dependency installation to **yes**.

:::note
Create requires a destination that does not exist. It will not write into an empty existing directory or merge generated files with another tree.
:::

## Verify the generated project

Enter the new directory and run its complete verification script:

```sh
cd my-project
pnpm verify
```

Every recipe checks formatting and lint rules, TypeScript, tests, unused files and dependencies, and its production build. The TypeScript library recipe also validates the packed package with Publint and Are the Types Wrong.

If you declined dependency installation, install first:

```sh
pnpm install
pnpm verify
```

## Review what Create owns

Open `.astilba/project.json` before your first commit. It records:

- the generator and recipe versions;
- managed files and their SHA-256 digests;
- seeded application files that become user-owned immediately;
- individually owned `package.json` fields; and
- the `CLAUDE.md` symbolic link and its target.

The manifest is evidence for future fail-closed migrations. Create 0.1.2 does not include an updater, and the manifest does not prevent you from changing any generated file.

## Make the first commit

When Git initialization is enabled, Create produces a fresh repository on `main` without an initial commit. Review the tree, then commit it yourself:

```sh
git status
git add .
git commit -m "chore: establish project"
```

The repository has no shared commit ancestry with Astilba Create.

## Configure GitHub after publishing

Push the repository to the owner and repository name you supplied, then follow `docs/repository-settings.md`. Generated files cannot turn on branch protection, merge settings, private-vulnerability reporting, a Renovate installation, or an npm publishing environment.

In particular:

- allow squash merging and enable automatic merging;
- configure the required verification checks on `main`;
- install or grant repository access to Renovate;
- keep the default workflow token read-only; and
- for public packages, design and configure the publication workflow, protected environment, and npm trusted publishing. Create does not generate that release path.

CodeQL and dependency review are designed for public repositories. Their generated workflows skip the relevant jobs when the repository is private.

## Continue from the generated README

The new README contains recipe-specific development commands. Use [Choose a recipe](/docs/create/recipes/) to compare the initial files and verification behavior, or [CLI reference](/docs/create/cli-reference/) when you need to rerun creation with explicit metadata.

import type { DocsProduct } from "../types.ts";

const createSections = [
  {
    label: "Get started",
    items: [
      {
        key: "overview",
        label: "Overview",
        slug: "overview",
        icon: "open-book",
        sourcePath: "src/content/docs/create/overview.md",
      },
      {
        key: "quickstart",
        label: "Create your first project",
        slug: "quickstart",
        icon: "rocket",
        sourcePath: "src/content/docs/create/quickstart.md",
      },
      {
        key: "recipes",
        label: "Choose a recipe",
        slug: "recipes",
        icon: "code-branch",
        sourcePath: "src/content/docs/create/recipes.md",
      },
    ],
  },
  {
    label: "Guides",
    items: [
      {
        key: "automation",
        label: "Automate project creation",
        slug: "automation",
        icon: "approve-check-circle",
        sourcePath: "src/content/docs/create/automation.md",
      },
    ],
  },
  {
    label: "Concepts",
    items: [
      {
        key: "deterministic-generation",
        label: "Deterministic generation",
        slug: "deterministic-generation",
        icon: "code-branch",
        sourcePath: "src/content/docs/create/deterministic-generation.md",
      },
      {
        key: "project-manifest",
        label: "Project manifest",
        slug: "project-manifest",
        icon: "file-digit",
        sourcePath: "src/content/docs/create/project-manifest.md",
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        key: "cli-reference",
        label: "CLI reference",
        slug: "cli-reference",
        icon: "open-book",
        sourcePath: "src/content/docs/create/cli-reference.md",
      },
      {
        key: "release-and-support",
        label: "Release and support",
        slug: "release-and-support",
        icon: "approve-check-circle",
        sourcePath: "src/content/docs/create/release-and-support.md",
      },
    ],
  },
] satisfies DocsProduct["versions"][number]["sections"];

export const createProduct = {
  id: "create",
  label: "Create",
  icon: "rocket",
  description:
    "A deterministic CLI that creates TypeScript projects with Astilba's maintained engineering foundations.",
  availabilityNote:
    "Released as create-astilba 0.2.0 on npm with four supported recipe v2 contracts.",
  homePath: "/create/",
  repositoryUrl: "https://github.com/astilbahq/create",
  status: {
    text: "Released",
    variant: "success",
  },
  defaultPage: "overview",
  defaultVersion: "0.2",
  versions: [
    {
      id: "0.2",
      label: "0.2",
      lifecycle: "latest",
      basePath: "create",
      sections: createSections,
    },
  ],
} satisfies DocsProduct;

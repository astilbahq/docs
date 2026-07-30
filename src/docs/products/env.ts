import type { DocsProduct } from "../types.ts";

const envSections = [
  {
    label: "Get started",
    items: [
      {
        key: "overview",
        label: "Overview",
        slug: "overview",
        icon: "open-book",
        sourcePath: "src/content/docs/env/overview.md",
      },
      {
        key: "quickstart",
        label: "Configure a Node application",
        slug: "quickstart",
        icon: "rocket",
        sourcePath: "src/content/docs/env/quickstart.md",
      },
    ],
  },
  {
    label: "Concepts",
    items: [
      {
        key: "lifecycles-and-projections",
        label: "Lifecycles and projections",
        slug: "lifecycles-and-projections",
        icon: "code-branch",
        sourcePath: "src/content/docs/env/lifecycles-and-projections.md",
      },
    ],
  },
  {
    label: "Guides",
    items: [
      {
        key: "browser-delivery",
        label: "Deliver browser configuration",
        slug: "browser-delivery",
        icon: "server",
        sourcePath: "src/content/docs/env/browser-delivery.md",
      },
      {
        key: "migrate-from-next-dynamic-env",
        label: "Migrate from next-dynamic-env",
        slug: "migrate-from-next-dynamic-env",
        icon: "code-branch",
        sourcePath: "src/content/docs/env/migrate-from-next-dynamic-env.md",
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        key: "declaration-reference",
        label: "Declaration reference",
        slug: "declaration-reference",
        icon: "file-digit",
        sourcePath: "src/content/docs/env/declaration-reference.md",
      },
      {
        key: "cli-reference",
        label: "CLI reference",
        slug: "cli-reference",
        icon: "open-book",
        sourcePath: "src/content/docs/env/cli-reference.md",
      },
      {
        key: "release-and-support",
        label: "Release and support",
        slug: "release-and-support",
        icon: "approve-check-circle",
        sourcePath: "src/content/docs/env/release-and-support.md",
      },
    ],
  },
] satisfies DocsProduct["versions"][number]["sections"];

export const envProduct = {
  id: "env",
  label: "Env",
  icon: "file-digit",
  description:
    "A local-first configuration contract compiler with explicit lifecycles and physically separated browser and server projections.",
  availabilityNote:
    "Released as @astilba/env 0.1.0 for public-alpha evaluation. Expect deliberate breaking changes before a stable release.",
  homePath: "/env/",
  repositoryUrl: "https://github.com/astilbahq/env",
  status: {
    text: "Public alpha",
    variant: "caution",
  },
  defaultPage: "overview",
  defaultVersion: "0.1",
  versions: [
    {
      id: "0.1",
      label: "0.1",
      lifecycle: "latest",
      basePath: "env",
      sections: envSections,
    },
  ],
} satisfies DocsProduct;

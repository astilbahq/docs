import type { DocsProduct } from "../types";

const cacheSections = [
  {
    label: "Start",
    items: [
      {
        key: "overview",
        label: "Overview",
        slug: "overview",
        icon: "open-book",
      },
      {
        key: "architecture",
        label: "Runtime architecture",
        slug: "architecture",
        icon: "code-branch",
      },
      {
        key: "quickstart",
        label: "API walkthrough",
        slug: "quickstart",
        icon: "rocket",
      },
      {
        key: "how-it-works",
        label: "How Cache works",
        slug: "how-it-works",
        icon: "code-branch",
      },
    ],
  },
  {
    label: "Guides",
    items: [
      {
        key: "reading-and-filling",
        label: "Reading and filling",
        slug: "reading-and-filling",
        icon: "database",
      },
      {
        key: "tags-and-invalidation",
        label: "Invalidating data",
        slug: "tags-and-invalidation",
        icon: "link",
      },
      {
        key: "scopes-and-privacy",
        label: "Scopes and privacy",
        slug: "scopes-and-privacy",
        icon: "padlock",
      },
    ],
  },
  {
    label: "Concepts",
    items: [
      {
        key: "consistency-and-resilience",
        label: "Consistency and resilience",
        slug: "consistency-and-resilience",
        icon: "approve-check-circle",
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        key: "api-status",
        label: "API status",
        slug: "api-status",
        icon: "approve-check-circle",
      },
      {
        key: "drivers-and-status",
        label: "Drivers and status",
        slug: "drivers-and-status",
        icon: "server",
      },
    ],
  },
] satisfies DocsProduct["versions"][number]["sections"];

export const cacheProduct = {
  id: "cache",
  label: "Cache",
  icon: "database",
  status: {
    text: "Preview",
    variant: "caution",
  },
  defaultPage: "overview",
  defaultVersion: "unreleased",
  versions: [
    {
      id: "unreleased",
      label: "Unreleased",
      lifecycle: "unreleased",
      basePath: "cache",
      sections: cacheSections,
    },
  ],
} satisfies DocsProduct;

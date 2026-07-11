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
        key: "quickstart",
        label: "Quickstart",
        slug: "quickstart",
        icon: "rocket",
      },
      {
        key: "reading-and-filling",
        label: "Reading and filling",
        slug: "reading-and-filling",
        icon: "database",
      },
    ],
  },
  {
    label: "Concepts",
    items: [
      {
        key: "tags-and-invalidation",
        label: "Tags and invalidation",
        slug: "tags-and-invalidation",
        icon: "link",
      },
      {
        key: "consistency-and-resilience",
        label: "Consistency and resilience",
        slug: "consistency-and-resilience",
        icon: "approve-check-circle",
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

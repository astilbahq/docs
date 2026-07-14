import type { DocsProduct } from "../types.ts";

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
        key: "react-and-server-apps",
        label: "React and server apps",
        slug: "react-and-server-apps",
        icon: "rocket",
      },
      {
        key: "quickstart",
        label: "Preview walkthrough",
        slug: "quickstart",
        icon: "rocket",
      },
      {
        key: "core-concepts",
        label: "Core concepts",
        slug: "core-concepts",
        icon: "open-book",
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
        key: "how-it-works",
        label: "How Cache works",
        slug: "how-it-works",
        icon: "code-branch",
      },
      {
        key: "consistency-and-resilience",
        label: "Consistency and resilience",
        slug: "consistency-and-resilience",
        icon: "approve-check-circle",
      },
    ],
  },
  {
    label: "Advanced",
    items: [
      {
        key: "architecture",
        label: "Runtime architecture",
        slug: "architecture",
        icon: "code-branch",
      },
      {
        key: "drivers-and-status",
        label: "Drivers and status",
        slug: "drivers-and-status",
        icon: "server",
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        key: "api-reference",
        label: "API reference",
        slug: "api-reference",
        icon: "open-book",
      },
      {
        key: "api-status",
        label: "API status",
        slug: "api-status",
        icon: "approve-check-circle",
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

import type { DocsProduct } from "../types.ts";

const cacheSections = [
  {
    label: "Get started",
    items: [
      {
        key: "overview",
        label: "Overview",
        slug: "overview",
        icon: "open-book",
      },
      {
        key: "quickstart",
        label: "Local quickstart",
        slug: "quickstart",
        icon: "rocket",
      },
    ],
  },
  {
    label: "Integrations",
    items: [
      {
        key: "cloudflare-workers",
        label: "Cloudflare Workers",
        slug: "cloudflare-workers",
        icon: "server",
      },
      {
        key: "react-and-server-apps",
        label: "React Router",
        slug: "react-and-server-apps",
        icon: "rocket",
      },
    ],
  },
  {
    label: "Guides",
    items: [
      {
        key: "reading-and-filling",
        label: "Read and cache values",
        slug: "reading-and-filling",
        icon: "database",
      },
      {
        key: "tags-and-invalidation",
        label: "Invalidate cached data",
        slug: "tags-and-invalidation",
        icon: "link",
      },
      {
        key: "scopes-and-privacy",
        label: "Control cache sharing",
        slug: "scopes-and-privacy",
        icon: "padlock",
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
    label: "Concepts",
    items: [
      {
        key: "core-concepts",
        label: "Cache fundamentals",
        slug: "core-concepts",
        icon: "open-book",
      },
      {
        key: "how-it-works",
        label: "How Cache works",
        slug: "how-it-works",
        icon: "code-branch",
      },
      {
        key: "architecture",
        label: "Runtime architecture",
        slug: "architecture",
        icon: "code-branch",
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
        key: "drivers-and-status",
        label: "Driver implementations",
        slug: "drivers-and-status",
        icon: "server",
      },
      {
        key: "api-status",
        label: "Implementation status",
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

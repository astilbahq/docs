export const docsIcons = [
  "approve-check-circle",
  "code-branch",
  "database",
  "link",
  "open-book",
  "padlock",
  "rocket",
  "server",
] as const;

export type DocsIcon = (typeof docsIcons)[number];

type DocsBadgeVariant =
  | "caution"
  | "danger"
  | "default"
  | "note"
  | "success"
  | "tip";

export interface DocsBadge {
  text: string;
  variant: DocsBadgeVariant;
}

export interface DocsPage {
  badge?: DocsBadge;
  icon: DocsIcon;
  key: string;
  label: string;
  slug: string;
}

interface DocsSection {
  items: DocsPage[];
  label: string;
}

type DocsVersionLifecycle =
  | "archived"
  | "latest"
  | "maintained"
  | "unreleased";

export interface DocsVersion {
  basePath: string;
  id: string;
  label: string;
  lifecycle: DocsVersionLifecycle;
  sections: DocsSection[];
}

export interface DocsProduct {
  defaultPage: string;
  defaultVersion: string;
  icon: DocsIcon;
  id: string;
  label: string;
  status?: DocsBadge;
  versions: DocsVersion[];
}

export interface DocsContext {
  page: DocsPage;
  product: DocsProduct;
  version: DocsVersion;
}

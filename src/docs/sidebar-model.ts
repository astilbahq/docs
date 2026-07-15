import type { StarlightRouteData } from "@astrojs/starlight/route-data";

import {
  docsProducts,
  findDocsContext,
  getDefaultPage,
  getDefaultVersion,
  getDocsIcon,
  getPageHref,
  getVersionMeta,
  getVersionPageHref,
} from "./catalog";
import type { DocsBadge, DocsIcon } from "./types";

type StarlightSidebarEntry = StarlightRouteData["sidebar"][number];

interface DocsMenuOption {
  href: string;
  icon: DocsIcon;
  id: string;
  label: string;
  meta?: string;
  selected: boolean;
  status?: DocsBadge;
}

export interface DocsContextRow {
  ariaLabel: string;
  icon: DocsIcon;
  label: string;
  meta?: string;
  options?: DocsMenuOption[];
  status?: DocsBadge;
}

export interface DocsSidebarContextModel {
  product: DocsContextRow;
  version?: DocsContextRow;
}

interface DocsSidebarEntryBase {
  badge?: DocsBadge;
  id: string;
  label: string;
}

interface DocsSidebarLinkModel extends DocsSidebarEntryBase {
  attrs: Record<string, boolean | number | string>;
  className?: string;
  href: string;
  icon?: DocsIcon;
  isCurrent: boolean;
  type: "link";
}

export interface DocsSidebarGroupModel extends DocsSidebarEntryBase {
  collapsed: boolean;
  containsCurrent: boolean;
  entries: DocsSidebarEntryModel[];
  type: "group";
}

export type DocsSidebarEntryModel =
  | DocsSidebarGroupModel
  | DocsSidebarLinkModel;

export const collectDocsSidebarGroupIds = (
  entries: DocsSidebarEntryModel[],
  predicate: (entry: DocsSidebarGroupModel) => boolean
): string[] =>
  entries.flatMap((entry) => {
    if (entry.type === "link") {
      return [];
    }

    const nestedIds = collectDocsSidebarGroupIds(entry.entries, predicate);
    return predicate(entry) ? [entry.id, ...nestedIds] : nestedIds;
  });

const toBadge = (
  badge: StarlightSidebarEntry["badge"]
): DocsBadge | undefined => {
  if (!badge) {
    return undefined;
  }

  return {
    text: badge.text,
    variant: badge.variant,
  };
};

const hasCurrentPage = (entries: DocsSidebarEntryModel[]): boolean =>
  entries.some((entry) =>
    entry.type === "link" ? entry.isCurrent : entry.containsCurrent
  );

const toLinkAttributes = (
  attributes: object
): Record<string, boolean | number | string> =>
  Object.fromEntries(
    Object.entries(attributes).filter(([name, value]) => {
      const normalizedName = name.toLowerCase();
      const isReserved =
        normalizedName === "class" ||
        normalizedName === "classname" ||
        normalizedName === "href" ||
        normalizedName === "style" ||
        normalizedName.startsWith("on");
      const isSerializable =
        typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "string";

      return !isReserved && isSerializable;
    })
  ) as Record<string, boolean | number | string>;

export const createDocsSidebarEntries = (
  entries: StarlightSidebarEntry[],
  parentPath: number[] = []
): DocsSidebarEntryModel[] =>
  entries.map((entry, index) => {
    const path = [...parentPath, index];
    const id = `docs-group-${path.join("-")}`;

    if (entry.type === "link") {
      const className =
        typeof entry.attrs.class === "string" ? entry.attrs.class : undefined;

      return {
        type: "link",
        id: `docs-link-${path.join("-")}`,
        label: entry.label,
        href: entry.href,
        isCurrent: entry.isCurrent,
        icon: getDocsIcon(entry.attrs["data-nav-icon"]),
        badge: toBadge(entry.badge),
        attrs: toLinkAttributes(entry.attrs),
        className,
      };
    }

    const childEntries = createDocsSidebarEntries(entry.entries, path);

    return {
      type: "group",
      id,
      label: entry.label,
      collapsed: entry.collapsed,
      containsCurrent: hasCurrentPage(childEntries),
      entries: childEntries,
      badge: toBadge(entry.badge),
    };
  });

const getSidebarIdentity = (entries: DocsSidebarEntryModel[]): unknown[] =>
  entries.map((entry) =>
    entry.type === "group"
      ? {
          type: entry.type,
          label: entry.label,
          entries: getSidebarIdentity(entry.entries),
        }
      : {
          type: entry.type,
          label: entry.label,
          href: entry.href,
        }
  );

export const getDocsSidebarHash = (
  entries: DocsSidebarEntryModel[]
): string => {
  const identity = JSON.stringify(getSidebarIdentity(entries));
  let hash = 0;

  for (let index = 0; index < identity.length; index += 1) {
    hash = (hash << 5) - hash + identity.charCodeAt(index);
  }

  return (hash >>> 0).toString(36).padStart(7, "0");
};

export const createDocsSidebarContext = (
  pathname: string
): DocsSidebarContextModel => {
  const context = findDocsContext(pathname);

  if (!context) {
    return {
      product: {
        ariaLabel: "Choose product. Viewing all products.",
        icon: "open-book",
        label: "All products",
        options: docsProducts.map((product) => {
          const version = getDefaultVersion(product);
          const page = getDefaultPage(product, version);

          return {
            id: product.id,
            label: product.label,
            icon: product.icon,
            status: product.status,
            selected: false,
            href: getPageHref(version, page),
          };
        }),
      },
    };
  }

  const { page, product, version } = context;
  const productOptions: DocsMenuOption[] = [
    {
      href: "/",
      icon: "open-book",
      id: "docs-home",
      label: "Docs home",
      selected: false,
    },
    ...docsProducts.map((option) => {
      const selected = option.id === product.id;
      const targetVersion = selected ? version : getDefaultVersion(option);

      return {
        id: option.id,
        label: option.label,
        icon: option.icon,
        status: option.status,
        selected,
        href: getVersionPageHref(option, targetVersion, page.key),
      };
    }),
  ];
  const versionOptions = product.versions.map((option) => ({
    id: option.id,
    label: option.label,
    icon: "code-branch" as const,
    meta: getVersionMeta(option),
    selected: option.id === version.id,
    href: getVersionPageHref(product, option, page.key),
  }));

  return {
    product: {
      ariaLabel: `Choose product. Current product: ${product.label}`,
      icon: product.icon,
      label: product.label,
      status: product.status,
      options: productOptions,
    },
    version: {
      ariaLabel:
        versionOptions.length > 1
          ? `Choose ${product.label} version. Current version: ${version.label}`
          : `${product.label} documentation version: ${version.label}`,
      icon: "code-branch",
      label: version.label,
      meta: getVersionMeta(version),
      options: versionOptions.length > 1 ? versionOptions : undefined,
    },
  };
};

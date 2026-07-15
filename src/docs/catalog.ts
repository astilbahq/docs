import type { StarlightUserConfig } from "@astrojs/starlight/types";

import { cacheProduct } from "./products/cache.ts";
import { siteDocsPages } from "./site-pages.ts";
import {
  docsIcons,
  type DocsContext,
  type DocsIcon,
  type DocsPage,
  type DocsProduct,
  type DocsVersion,
} from "./types.ts";

const assertUnique = (
  values: Set<string>,
  value: string,
  description: string
): void => {
  if (values.has(value)) {
    throw new Error(`Duplicate ${description}: "${value}".`);
  }

  values.add(value);
};

const normalizePath = (path: string): string => path.replace(/^\/+|\/+$/g, "");

export const validateDocsProducts = (products: DocsProduct[]): void => {
  const productIds = new Set<string>();
  const basePaths = new Set<string>();
  const globalRoutes = new Set(
    siteDocsPages.map(({ canonicalPath }) => normalizePath(canonicalPath))
  );
  const routes = new Set<string>();

  for (const product of products) {
    assertUnique(productIds, product.id, "documentation product id");

    if (product.versions.length === 0) {
      throw new Error(`${product.label} must declare at least one version.`);
    }

    const versionIds = new Set<string>();
    let hasDefaultVersion = false;

    for (const version of product.versions) {
      assertUnique(
        versionIds,
        version.id,
        `${product.label} documentation version id`
      );
      if (routes.has(version.basePath)) {
        throw new Error(
          `Documentation base path collides with a page route: "${version.basePath}".`
        );
      }

      if (globalRoutes.has(version.basePath)) {
        throw new Error(
          `Documentation base path collides with a global page: "${version.basePath}".`
        );
      }

      assertUnique(basePaths, version.basePath, "documentation base path");

      if (version.id === product.defaultVersion) {
        hasDefaultVersion = true;
      }

      const pageKeys = new Set<string>();
      const pageSlugs = new Set<string>();
      let hasDefaultPage = false;

      for (const page of version.sections.flatMap(({ items }) => items)) {
        const route = `${version.basePath}/${page.slug}`;

        if (basePaths.has(route)) {
          throw new Error(
            `Documentation page route collides with a version root: "${route}".`
          );
        }

        if (globalRoutes.has(route)) {
          throw new Error(
            `Documentation page route collides with a global page: "${route}".`
          );
        }

        assertUnique(
          pageKeys,
          page.key,
          `${product.label} ${version.label} page key`
        );
        assertUnique(
          pageSlugs,
          page.slug,
          `${product.label} ${version.label} page slug`
        );
        assertUnique(routes, route, "documentation route");

        if (page.key === product.defaultPage) {
          hasDefaultPage = true;
        }
      }

      if (!hasDefaultPage) {
        throw new Error(
          `Missing default page "${product.defaultPage}" for ${product.label} ${version.label}.`
        );
      }
    }

    if (!hasDefaultVersion) {
      throw new Error(
        `Missing default version "${product.defaultVersion}" for ${product.label}.`
      );
    }
  }
};

export const docsProducts: DocsProduct[] = [cacheProduct];
validateDocsProducts(docsProducts);

export const docsSidebar: NonNullable<StarlightUserConfig["sidebar"]> =
  docsProducts.map((product) => ({
    label: product.label,
    badge: product.status,
    collapsed: false,
    items: product.versions.map((version) => ({
      label: version.label,
      collapsed: false,
      items: version.sections.map((section) => ({
        label: section.label,
        collapsed: false,
        items: section.items.map((page) => ({
          label: page.label,
          slug: `${version.basePath}/${page.slug}`,
          badge: page.badge,
          attrs: {
            "data-doc-key": page.key,
            "data-nav-icon": page.icon,
            "data-product": product.id,
            "data-version": version.id,
          },
        })),
      })),
    })),
  }));

const docsIconNames = new Set<string>(docsIcons);

export const getPageHref = (version: DocsVersion, page: DocsPage): string =>
  `/${version.basePath}/${page.slug}/`;

export const getDefaultVersion = (product: DocsProduct): DocsVersion => {
  const version = product.versions.find(
    ({ id }) => id === product.defaultVersion
  );

  if (!version) {
    throw new Error(
      `Missing default version "${product.defaultVersion}" for ${product.label}.`
    );
  }

  return version;
};

export const getDefaultPage = (
  product: DocsProduct,
  version: DocsVersion
): DocsPage => {
  const page = version.sections
    .flatMap(({ items }) => items)
    .find(({ key }) => key === product.defaultPage);

  if (!page) {
    throw new Error(
      `Missing default page "${product.defaultPage}" for ${product.label} ${version.label}.`
    );
  }

  return page;
};

export const getVersionPageHref = (
  product: DocsProduct,
  version: DocsVersion,
  pageKey: string
): string => {
  const page = version.sections
    .flatMap(({ items }) => items)
    .find(({ key }) => key === pageKey);

  return getPageHref(version, page ?? getDefaultPage(product, version));
};

export const findDocsContext = (pathname: string): DocsContext | undefined => {
  const path = normalizePath(pathname);

  for (const product of docsProducts) {
    for (const version of product.versions) {
      for (const page of version.sections.flatMap(({ items }) => items)) {
        if (path === normalizePath(getPageHref(version, page))) {
          return { page, product, version };
        }
      }
    }
  }

  return undefined;
};

export const getVersionMeta = (version: DocsVersion): string => {
  switch (version.lifecycle) {
    case "latest":
      return "Latest";
    case "maintained":
      return "Maintained";
    case "archived":
      return "Archived";
    case "unreleased":
      return "Current";
  }
};

export const getDocsIcon = (value: unknown): DocsIcon | undefined => {
  if (typeof value !== "string" || !docsIconNames.has(value)) {
    return undefined;
  }

  return value as DocsIcon;
};

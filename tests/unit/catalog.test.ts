import { describe, expect, it } from "vitest";

import {
  docsProducts,
  findDocsContext,
  getDefaultPage,
  getDefaultVersion,
  getDocsIcon,
  getPageHref,
  getVersionMeta,
  getVersionPageHref,
  validateDocsProducts,
} from "../../src/docs/catalog";

describe("documentation catalog", () => {
  const cache = docsProducts[0];

  it("resolves the configured default route", () => {
    expect(cache).toBeDefined();

    const version = getDefaultVersion(cache);
    const page = getDefaultPage(cache, version);

    expect(version.id).toBe("unreleased");
    expect(page.key).toBe("overview");
    expect(cache.repositoryUrl).toBe("https://github.com/astilbahq/cache");
    expect(getPageHref(version, page)).toBe("/cache/overview/");
  });

  it("organizes Cache pages by reader intent", () => {
    const version = getDefaultVersion(cache);

    expect(
      version.sections.map(({ items, label }) => ({
        label,
        pages: items.map((page) => page.label),
      }))
    ).toEqual([
      {
        label: "Get started",
        pages: ["Overview", "Local quickstart"],
      },
      {
        label: "Platforms",
        pages: ["Cloudflare Workers"],
      },
      {
        label: "Frameworks",
        pages: ["React Router"],
      },
      {
        label: "Guides",
        pages: [
          "Read and cache values",
          "Invalidate cached data",
          "Control cache sharing",
          "Cache HTTP responses",
          "Consistency and resilience",
          "Inspect cache behavior",
        ],
      },
      {
        label: "Concepts",
        pages: [
          "Cache fundamentals",
          "How Cache works",
          "Runtime architecture",
        ],
      },
      {
        label: "Reference",
        pages: [
          "API reference",
          "Driver implementations",
          "Implementation status",
        ],
      },
    ]);
  });

  it("finds a page with or without surrounding slashes", () => {
    const withSlashes = findDocsContext("/cache/quickstart/");
    const withoutSlashes = findDocsContext("cache/quickstart");

    expect(withSlashes?.page.key).toBe("quickstart");
    expect(withoutSlashes).toEqual(withSlashes);
    expect(findDocsContext("/not-a-doc/")).toBeUndefined();
  });

  it("keeps version roots distinct from page routes", () => {
    const version = getDefaultVersion(cache);
    const conflictingProduct = {
      ...cache,
      defaultVersion: "collision",
      id: "collision",
      label: "Collision",
      versions: [
        {
          ...version,
          basePath: "cache/overview",
          id: "collision",
          label: "Collision",
        },
      ],
    };

    expect(() => validateDocsProducts([cache, conflictingProduct])).toThrow(
      'Documentation base path collides with a page route: "cache/overview".'
    );
  });

  it("keeps product routes distinct from global documentation", () => {
    const version = getDefaultVersion(cache);
    const conflictingProduct = {
      ...cache,
      defaultVersion: "collision",
      id: "collision",
      label: "Collision",
      versions: [
        {
          ...version,
          basePath: "agents/mcp",
          id: "collision",
          label: "Collision",
        },
      ],
    };

    expect(() => validateDocsProducts([cache, conflictingProduct])).toThrow(
      'Documentation base path collides with a global page: "agents/mcp".'
    );
  });

  it("keeps public pages mapped to distinct source files", () => {
    const version = getDefaultVersion(cache);
    const [firstSection, ...remainingSections] = version.sections;
    const [firstPage, ...remainingPages] = firstSection.items;
    const conflictingProduct = {
      ...cache,
      versions: [
        {
          ...version,
          sections: [
            {
              ...firstSection,
              items: [
                {
                  ...firstPage,
                  sourcePath: "src/content/docs/index.md",
                },
                ...remainingPages,
              ],
            },
            ...remainingSections,
          ],
        },
      ],
    };

    expect(() => validateDocsProducts([conflictingProduct])).toThrow(
      'Duplicate documentation source path: "src/content/docs/index.md".'
    );
  });

  it("preserves a page key when available and falls back safely", () => {
    const version = getDefaultVersion(cache);

    expect(getVersionPageHref(cache, version, "api-reference")).toBe(
      "/cache/api-reference/"
    );
    expect(getVersionPageHref(cache, version, "missing-page")).toBe(
      "/cache/overview/"
    );
  });

  it("maps lifecycle and icon metadata", () => {
    const version = getDefaultVersion(cache);

    expect(getVersionMeta(version)).toBe("Current");
    expect(getVersionMeta({ ...version, lifecycle: "latest" })).toBe("Latest");
    expect(getVersionMeta({ ...version, lifecycle: "maintained" })).toBe(
      "Maintained"
    );
    expect(getVersionMeta({ ...version, lifecycle: "archived" })).toBe(
      "Archived"
    );
    expect(getDocsIcon("database")).toBe("database");
    expect(getDocsIcon("unknown")).toBeUndefined();
    expect(getDocsIcon(null)).toBeUndefined();
  });
});

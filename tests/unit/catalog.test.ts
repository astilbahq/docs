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
} from "../../src/docs/catalog";

describe("documentation catalog", () => {
  const cache = docsProducts[0];

  it("resolves the configured default route", () => {
    expect(cache).toBeDefined();

    const version = getDefaultVersion(cache);
    const page = getDefaultPage(cache, version);

    expect(version.id).toBe("unreleased");
    expect(page.key).toBe("overview");
    expect(getPageHref(version, page)).toBe("/cache/overview/");
  });

  it("finds a page with or without surrounding slashes", () => {
    const withSlashes = findDocsContext("/cache/quickstart/");
    const withoutSlashes = findDocsContext("cache/quickstart");

    expect(withSlashes?.page.key).toBe("quickstart");
    expect(withoutSlashes).toEqual(withSlashes);
    expect(findDocsContext("/not-a-doc/")).toBeUndefined();
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

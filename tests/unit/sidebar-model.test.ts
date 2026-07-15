import { describe, expect, it } from "vitest";

import {
  collectDocsSidebarGroupIds,
  createDocsSidebarContext,
  createDocsSidebarEntries,
  getDocsSidebarHash,
} from "../../src/docs/sidebar-model";

type SidebarInput = Parameters<typeof createDocsSidebarEntries>[0];

const sidebarInput = [
  {
    type: "group",
    label: "Start",
    collapsed: false,
    badge: undefined,
    entries: [
      {
        type: "link",
        label: "Overview",
        href: "/cache/overview/",
        isCurrent: true,
        badge: undefined,
        attrs: {
          class: "current",
          href: "/unsafe/",
          onclick: "unsafe()",
          style: "color: red",
          "data-nav-icon": "open-book",
          "data-product": "cache",
          hidden: false,
        },
      },
    ],
  },
] as SidebarInput;

describe("documentation sidebar model", () => {
  it("creates stable ids and filters reserved link attributes", () => {
    const entries = createDocsSidebarEntries(sidebarInput);
    const group = entries[0];

    expect(group?.type).toBe("group");
    if (!group || group.type !== "group") {
      throw new Error("Expected a sidebar group.");
    }

    const link = group.entries[0];
    expect(link?.type).toBe("link");
    if (!link || link.type !== "link") {
      throw new Error("Expected a sidebar link.");
    }

    expect(group.id).toBe("docs-group-0");
    expect(group.containsCurrent).toBe(true);
    expect(link.id).toBe("docs-link-0-0");
    expect(link.className).toBe("current");
    expect(link.icon).toBe("open-book");
    expect(link.attrs).toEqual({
      "data-nav-icon": "open-book",
      "data-product": "cache",
      hidden: false,
    });
  });

  it("collects groups recursively and hashes navigation identity", () => {
    const entries = createDocsSidebarEntries(sidebarInput);
    const hash = getDocsSidebarHash(entries);

    expect(collectDocsSidebarGroupIds(entries, () => true)).toEqual([
      "docs-group-0",
    ]);
    expect(getDocsSidebarHash(entries)).toBe(hash);
    expect(
      getDocsSidebarHash(
        createDocsSidebarEntries([
          ...sidebarInput,
          {
            type: "link",
            label: "Reference",
            href: "/cache/api-reference/",
            isCurrent: false,
            badge: undefined,
            attrs: {},
          },
        ])
      )
    ).not.toBe(hash);
  });

  it("describes known and unknown documentation contexts", () => {
    const known = createDocsSidebarContext("/cache/overview/");
    const unknown = createDocsSidebarContext("/outside/");
    const docsHome = known.product.options?.find(
      (option) => option.id === "docs-home"
    );
    const cache = known.product.options?.find(
      (option) => option.id === "cache"
    );

    expect(known.product.label).toBe("Cache");
    expect(docsHome).toMatchObject({
      href: "/",
      label: "Docs home",
      selected: false,
    });
    expect(cache).toMatchObject({
      href: "/cache/overview/",
      label: "Cache",
      selected: true,
    });
    expect(known.version?.label).toBe("Unreleased");
    expect(unknown.product.label).toBe("All products");
    expect(unknown.product.options?.[0]?.href).toBe("/cache/overview/");
  });
});

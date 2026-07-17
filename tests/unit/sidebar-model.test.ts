import { describe, expect, it } from "vitest";

import {
  collectDocsSidebarGroupIds,
  createDocsSidebarContext,
  createDocsSidebarEntries,
  createSiteSidebarEntries,
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

    expect(known.product.label).toBe("Cache");
    expect(known.product.href).toBe("/cache/");
    expect(known.product.options).toBeUndefined();
    expect(known.version?.label).toBe("Unreleased");
    expect(unknown.product.label).toBe("Cache");
    expect(unknown.product.href).toBe("/cache/");
    expect(unknown.product.options).toBeUndefined();

    const productHome = createDocsSidebarContext("/cache/");
    expect(productHome.product.href).toBe("/cache/");
    expect(productHome.version?.label).toBe("Unreleased");
  });

  it("adds global agent navigation independently of product context", () => {
    const homeEntries = createSiteSidebarEntries("/");
    const mcpEntries = createSiteSidebarEntries("/agents/mcp/");
    const homeGroup = homeEntries[0];
    const mcpGroup = mcpEntries[0];

    expect(homeGroup).toMatchObject({
      type: "group",
      label: "AI for Agents",
      collapsed: false,
      containsCurrent: false,
    });
    expect(mcpGroup).toMatchObject({
      type: "group",
      label: "AI for Agents",
      containsCurrent: true,
    });
    expect(homeGroup?.type === "group" && homeGroup.entries).toMatchObject([
      {
        type: "link",
        label: "LLMs.txt",
        href: "/agents/llms-txt/",
        icon: "file-digit",
        isCurrent: false,
      },
      {
        type: "link",
        label: "MCP Server",
        href: "/agents/mcp/",
        icon: "model-context-protocol",
        isCurrent: false,
      },
    ]);
    expect(mcpGroup?.type === "group" && mcpGroup.entries[1]).toMatchObject({
      isCurrent: true,
    });
  });
});

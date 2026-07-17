import type { DocsIcon } from "./types";

interface SiteDocsNavigation {
  group: string;
  icon: DocsIcon;
  label: string;
}

export interface SiteDocsPage {
  canonicalPath: string;
  id: string;
  markdownPath: string;
  navigation?: SiteDocsNavigation;
  presentation?: "product-home";
  productId?: string;
  sourcePath: string;
}

export const siteDocsPages: readonly SiteDocsPage[] = Object.freeze([
  {
    canonicalPath: "/",
    id: "index",
    markdownPath: "/index.md",
    sourcePath: "src/content/docs/index.md",
  },
  {
    canonicalPath: "/cache/",
    id: "cache",
    markdownPath: "/cache.md",
    presentation: "product-home",
    productId: "cache",
    sourcePath: "src/content/docs/cache.md",
  },
  {
    canonicalPath: "/agents/llms-txt/",
    id: "agents/llms-txt",
    markdownPath: "/agents/llms-txt.md",
    navigation: {
      group: "AI for Agents",
      icon: "file-digit",
      label: "LLMs.txt",
    },
    sourcePath: "src/content/docs/agents/llms-txt.md",
  },
  {
    canonicalPath: "/agents/mcp/",
    id: "agents/mcp",
    markdownPath: "/agents/mcp.md",
    navigation: {
      group: "AI for Agents",
      icon: "model-context-protocol",
      label: "MCP Server",
    },
    sourcePath: "src/content/docs/agents/mcp.md",
  },
]);

export const findSiteDocsPage = (id: string): SiteDocsPage | undefined =>
  siteDocsPages.find((page) => page.id === id);

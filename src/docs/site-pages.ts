export interface SiteDocsPage {
  canonicalPath: string;
  id: string;
  markdownPath: string;
}

export const siteDocsPages = Object.freeze([
  {
    canonicalPath: "/",
    id: "index",
    markdownPath: "/index.md",
  },
  {
    canonicalPath: "/agents/mcp/",
    id: "agents/mcp",
    markdownPath: "/agents/mcp.md",
  },
] satisfies SiteDocsPage[]);

export const findSiteDocsPage = (id: string): SiteDocsPage | undefined =>
  siteDocsPages.find((page) => page.id === id);

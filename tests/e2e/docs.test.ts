import { createHash } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { expect, type Page, test } from "@playwright/test";

import { EXPECTED_CORPUS_PAGES } from "../../src/docs/mcp-corpus";
import { GLOBAL_SECURITY_HEADERS } from "../../src/docs/security";

interface WebMcpToolProbe {
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input?: { offset?: number }) => Promise<string>;
  name: string;
}

declare global {
  interface Window {
    __cspViolations?: Array<{
      blockedUri: string;
      effectiveDirective: string;
    }>;
    __webMcpRegistrationMethods?: string[];
    __webMcpTools?: WebMcpToolProbe[];
  }
}

const docsOrigin = "https://docs.astilba.com";

const expectSimpleGetCors = (headers: Record<string, string>): void => {
  expect(headers["access-control-allow-origin"]).toBe("*");
  expect(headers["access-control-allow-headers"]).toBeUndefined();
  expect(headers["access-control-allow-methods"]).toBeUndefined();
};

const expectGlobalSecurityHeaders = (headers: Record<string, string>): void => {
  for (const [name, value] of Object.entries(GLOBAL_SECURITY_HEADERS)) {
    expect(headers[name.toLowerCase()]).toBe(value);
  }
};

const getExpectedPageDiscoveryLink = (markdownPath: string): string =>
  `<${markdownPath}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain", </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`;

const expectNoAxeViolations = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page })
    // Base UI's focus sentinels are intentionally keyboard-focusable and hidden
    // from the accessibility tree; axe otherwise reports the focus-loop
    // implementation itself instead of the interactive surface it protects.
    .exclude("[data-base-ui-focus-guard]")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    results.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map(({ target }) => target),
    }))
  ).toEqual([]);
};

test("serves the public documentation corpus over MCP", async ({ baseURL }) => {
  if (!baseURL) {
    throw new Error("The MCP test requires Playwright's local Worker URL.");
  }

  const client = new Client({
    name: "astilba-docs-test",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(new URL("/mcp", baseURL));

  try {
    await client.connect(transport);
    await client.ping();
    const tools = await client.listTools();
    const resources = await client.listResources();
    const search = await client.callTool({
      arguments: { query: "tag invalidation" },
      name: "search_docs",
    });
    const overviewUri = `${docsOrigin}/cache/overview.md`;
    const overview = await client.readResource({ uri: overviewUri });

    expect(tools.tools.map(({ name }) => name)).toEqual([
      "search_docs",
      "read_doc",
    ]);
    expect(
      tools.tools.every(
        ({ annotations }) =>
          annotations?.readOnlyHint === true &&
          annotations.destructiveHint === false &&
          annotations.openWorldHint === false
      )
    ).toBe(true);
    expect(resources.resources).toHaveLength(EXPECTED_CORPUS_PAGES);
    expect(resources.resources.some(({ uri }) => uri === overviewUri)).toBe(
      true
    );
    const searchOutput = search.structuredContent as {
      results: Array<Record<string, unknown>>;
    };
    expect(searchOutput.results[0]).toMatchObject({
      title: "Invalidate cached data",
      uri: `${docsOrigin}/cache/tags-and-invalidation.md`,
    });
    expect(overview.contents[0]).toMatchObject({
      mimeType: "text/markdown",
      uri: overviewUri,
    });
    expect(overview.contents[0]).toHaveProperty(
      "text",
      expect.stringContaining("# Overview")
    );
  } finally {
    await client.close();
  }
});

test("serves the direct sitemap as a static XML asset", async ({ request }) => {
  const sitemapResponse = await request.get("/sitemap.xml", {
    maxRedirects: 0,
  });
  expect(sitemapResponse.status()).toBe(200);
  expect(sitemapResponse.headers()["content-type"]).toContain(
    "application/xml"
  );
  expectGlobalSecurityHeaders(sitemapResponse.headers());
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
  );
  expect(sitemap).toContain(`<loc>${docsOrigin}/</loc>`);
  expect(sitemap).toMatch(
    /<lastmod>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z<\/lastmod>/
  );

  const sitemapHeadResponse = await request.head("/sitemap.xml", {
    maxRedirects: 0,
  });
  expect(sitemapHeadResponse.status()).toBe(200);
  expect(sitemapHeadResponse.headers()["content-type"]).toContain(
    "application/xml"
  );
  expectGlobalSecurityHeaders(sitemapHeadResponse.headers());
});

test("publishes MCP and RFC 9727 discovery metadata", async ({
  page,
  request,
}) => {
  const apiCatalogResponse = await request.get("/.well-known/api-catalog", {
    maxRedirects: 0,
  });
  expect(apiCatalogResponse.status()).toBe(200);
  expect(apiCatalogResponse.headers()["content-type"]).toBe(
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"'
  );
  expectSimpleGetCors(apiCatalogResponse.headers());
  expect(apiCatalogResponse.headers()["x-content-type-options"]).toBe(
    "nosniff"
  );
  expectGlobalSecurityHeaders(apiCatalogResponse.headers());
  expect(await apiCatalogResponse.json()).toEqual({
    linkset: [
      {
        anchor: `${docsOrigin}/mcp`,
        "service-desc": [
          {
            href: `${docsOrigin}/mcp/server-card`,
            type: "application/mcp-server-card+json",
          },
        ],
        "service-doc": [
          {
            href: `${docsOrigin}/agents/mcp/`,
            type: "text/html",
          },
        ],
      },
    ],
  });

  const apiCatalogHead = await request.head("/.well-known/api-catalog", {
    maxRedirects: 0,
  });
  expect(apiCatalogHead.status()).toBe(200);
  expect(apiCatalogHead.headers().link).toBe(
    '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"'
  );

  const mcpCatalogResponse = await request.get("/.well-known/mcp/catalog.json");
  expect(mcpCatalogResponse.status()).toBe(200);
  expect(mcpCatalogResponse.headers()["content-type"]).toContain(
    "application/json"
  );
  expectSimpleGetCors(mcpCatalogResponse.headers());
  expect(await mcpCatalogResponse.json()).toEqual({
    entries: [
      {
        identifier: "urn:air:astilba.com:docs",
        type: "application/mcp-server-card+json",
        url: `${docsOrigin}/mcp/server-card`,
      },
    ],
    specVersion: "draft",
  });

  const serverCardResponse = await request.get("/mcp/server-card", {
    headers: { Accept: "application/mcp-server-card+json" },
    maxRedirects: 0,
  });
  expect(serverCardResponse.status()).toBe(200);
  expect(serverCardResponse.headers()["content-type"]).toBe(
    "application/mcp-server-card+json"
  );
  expectSimpleGetCors(serverCardResponse.headers());
  const serverCard = await serverCardResponse.json();
  expect(serverCard).toMatchObject({
    name: "com.astilba/docs",
    remotes: [
      {
        type: "streamable-http",
        url: `${docsOrigin}/mcp`,
      },
    ],
    version: "0.1.0",
  });
  expect(serverCard).not.toHaveProperty("capabilities");
  const serverCardHead = await request.head("/mcp/server-card", {
    maxRedirects: 0,
  });
  expect(serverCardHead.status()).toBe(200);
  expect(serverCardHead.headers()["content-type"]).toBe(
    "application/mcp-server-card+json"
  );

  const compatibilityCardResponse = await request.get(
    "/.well-known/mcp/server-card.json"
  );
  expect(compatibilityCardResponse.status()).toBe(200);
  expectSimpleGetCors(compatibilityCardResponse.headers());
  expect(await compatibilityCardResponse.json()).toMatchObject({
    capabilities: { resources: {}, tools: {} },
    serverInfo: { name: "com.astilba/docs", version: "0.1.0" },
    transport: {
      endpoint: `${docsOrigin}/mcp`,
      type: "streamable-http",
    },
  });

  const unsupportedMcpMethod = await request.get("/mcp");
  expect(unsupportedMcpMethod.status()).toBe(405);
  expectGlobalSecurityHeaders(unsupportedMcpMethod.headers());

  const initializeMcp = await request.post("/mcp", {
    data: {
      id: 1,
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        capabilities: {},
        clientInfo: { name: "edge-header-test", version: "1.0.0" },
        protocolVersion: "2025-11-25",
      },
    },
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "MCP-Protocol-Version": "2025-11-25",
    },
  });
  expect(initializeMcp.status()).toBe(200);
  expectGlobalSecurityHeaders(initializeMcp.headers());

  const usageResponse = await request.get("/agents/mcp/", {
    maxRedirects: 0,
  });
  expect(usageResponse.status()).toBe(200);
  expect(await usageResponse.text()).toContain("Documentation MCP");
  const usageMarkdownResponse = await request.get("/agents/mcp/", {
    headers: { Accept: "text/markdown" },
  });
  expect(usageMarkdownResponse.headers()["content-location"]).toBe(
    "/agents/mcp.md"
  );
  expect(await usageMarkdownResponse.text()).toContain("# Documentation MCP");

  await page.goto("/agents/mcp/");
  await expect(
    page.getByRole("heading", { name: "Documentation MCP" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy Markdown" })
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("serves agent-readable Markdown and keeps copy states independent", async ({
  page,
  request,
}) => {
  const homeMarkdownResponse = await request.get("/", {
    headers: { Accept: "text/markdown" },
  });
  expect(homeMarkdownResponse.ok()).toBe(true);
  expect(homeMarkdownResponse.headers()["content-type"]).toContain(
    "text/markdown"
  );
  expect(homeMarkdownResponse.headers().vary).toContain("Accept");
  expect(await homeMarkdownResponse.text()).toContain(
    "# Astilba documentation"
  );

  const rootMarkdownResponse = await request.get("/index.md");
  expect(rootMarkdownResponse.status()).toBe(200);
  expect(rootMarkdownResponse.headers()["content-type"]).toBe(
    "text/markdown; charset=utf-8"
  );
  expect(rootMarkdownResponse.headers()["x-content-type-options"]).toBe(
    "nosniff"
  );
  expect(rootMarkdownResponse.headers().etag).toBeTruthy();

  for (const { markdownPath, pagePath } of [
    { markdownPath: "/index.md", pagePath: "/" },
    {
      markdownPath: "/cache/overview.md",
      pagePath: "/cache/overview/",
    },
  ]) {
    const expectedLink = getExpectedPageDiscoveryLink(markdownPath);
    const pageResponse = await request.get(pagePath, {
      headers: { Accept: "text/html" },
    });
    expect(pageResponse.status()).toBe(200);
    expect(pageResponse.headers().link).toBe(expectedLink);
    expect(pageResponse.headers().vary).toContain("Accept");
    const pageEtag = pageResponse.headers().etag;
    expect(pageEtag).toBeTruthy();
    if (!pageEtag) {
      throw new Error(`${pagePath} must include an ETag.`);
    }

    const pageHeadResponse = await request.head(pagePath, {
      headers: { Accept: "text/html" },
    });
    expect(pageHeadResponse.status()).toBe(200);
    expect(pageHeadResponse.headers().link).toBe(expectedLink);

    const pageRevalidationResponse = await request.get(pagePath, {
      headers: {
        Accept: "text/html",
        "If-None-Match": pageEtag,
      },
    });
    expect(pageRevalidationResponse.status()).toBe(304);
    expect(pageRevalidationResponse.headers().link).toBe(expectedLink);
  }

  const negotiatedMarkdownResponse = await request.get("/cache/overview/", {
    headers: { Accept: "text/markdown" },
  });
  expect(negotiatedMarkdownResponse.ok()).toBe(true);
  expect(negotiatedMarkdownResponse.headers()["content-type"]).toContain(
    "text/markdown"
  );
  expect(negotiatedMarkdownResponse.headers()["content-location"]).toBe(
    "/cache/overview.md"
  );
  expect(negotiatedMarkdownResponse.headers()["content-signal"]).toBe(
    "ai-train=yes, search=yes, ai-input=yes"
  );
  expect(negotiatedMarkdownResponse.headers().link).toContain(
    'rel="describedby"'
  );
  expect(negotiatedMarkdownResponse.headers().vary).toContain("Accept");
  expect(await negotiatedMarkdownResponse.text()).toContain(
    "For React applications, “server-side” means"
  );

  const markdownHeadResponse = await request.head("/cache/overview/", {
    headers: { Accept: "text/markdown" },
  });
  expect(markdownHeadResponse.ok()).toBe(true);
  expect(markdownHeadResponse.headers()["content-type"]).toContain(
    "text/markdown"
  );

  const canonicalRedirect = await request.get("/cache/overview", {
    headers: { Accept: "text/markdown" },
    maxRedirects: 0,
  });
  expect(canonicalRedirect.status()).toBe(307);
  expect(canonicalRedirect.headers().location).toBe("/cache/overview/");

  for (const productRoot of ["/cache", "/cache/"]) {
    const productRootRedirect = await request.get(productRoot, {
      maxRedirects: 0,
    });
    expect(productRootRedirect.status()).toBe(307);
    expect(productRootRedirect.headers().location).toBe("/cache/overview/");
  }

  const htmlResponse = await request.get("/cache/overview/", {
    headers: { Accept: "text/html, text/markdown;q=0" },
  });
  expect(htmlResponse.headers()["content-type"]).toContain("text/html");
  expect(htmlResponse.headers().vary).toContain("Accept");
  expectGlobalSecurityHeaders(htmlResponse.headers());

  const preferredHtmlResponse = await request.get("/cache/overview/", {
    headers: { Accept: "text/html;q=1, text/markdown;q=0.1" },
  });
  expect(preferredHtmlResponse.headers()["content-type"]).toContain(
    "text/html"
  );

  const markdownResponse = await request.get("/cache/overview.md");
  expect(markdownResponse.ok()).toBe(true);
  expect(markdownResponse.headers()["content-type"]).toBe(
    "text/markdown; charset=utf-8"
  );
  expect(markdownResponse.headers()["x-content-type-options"]).toBe("nosniff");
  expectGlobalSecurityHeaders(markdownResponse.headers());
  const markdownEtag = markdownResponse.headers().etag;
  expect(markdownEtag).toBeTruthy();
  if (!markdownEtag) {
    throw new Error("The direct Markdown response must include an ETag.");
  }
  const markdown = await markdownResponse.text();
  expect(markdown).toContain("# Overview");
  expect(markdown).toContain("For React applications, “server-side” means");

  const markdownRevalidationResponse = await request.get("/cache/overview.md", {
    headers: { "If-None-Match": markdownEtag },
  });
  expect(markdownRevalidationResponse.status()).toBe(304);
  expect(markdownRevalidationResponse.headers()["content-type"]).toBe(
    "text/markdown; charset=utf-8"
  );
  expect(markdownRevalidationResponse.headers()["x-content-type-options"]).toBe(
    "nosniff"
  );

  const missingMarkdownResponse = await request.get("/missing/", {
    headers: { Accept: "text/markdown" },
  });
  expect(missingMarkdownResponse.status()).toBe(404);
  expect(missingMarkdownResponse.headers()["content-type"]).toContain(
    "text/html"
  );
  expect(missingMarkdownResponse.headers().link).toBeUndefined();

  const missingNestedPageResponse = await request.get("/cache/missing/", {
    headers: { Accept: "text/html" },
  });
  expect(missingNestedPageResponse.status()).toBe(404);
  expect(missingNestedPageResponse.headers()["content-type"]).toContain(
    "text/html"
  );
  expect(missingNestedPageResponse.headers().link).toBeUndefined();

  const missingPageHeadResponse = await request.head("/cache/missing/", {
    headers: { Accept: "text/html" },
  });
  expect(missingPageHeadResponse.status()).toBe(404);
  expect(missingPageHeadResponse.headers().link).toBeUndefined();

  const missingDirectResponse = await request.get("/missing.md");
  const missingEtag = missingDirectResponse.headers().etag;
  expect(missingDirectResponse.status()).toBe(404);
  expect(missingDirectResponse.headers()["content-type"]).toContain(
    "text/html"
  );
  expect(missingEtag).toBeTruthy();

  const missingNestedResponse = await request.get("/cache/missing.md");
  expect(missingNestedResponse.status()).toBe(404);
  expect(missingNestedResponse.headers()["content-type"]).toContain(
    "text/html"
  );

  const missingRevalidationResponse = await request.get("/missing/", {
    headers: {
      Accept: "text/markdown",
      "If-None-Match": missingEtag,
    },
  });
  expect(missingRevalidationResponse.status()).toBe(304);
  expect(missingRevalidationResponse.headers()["content-type"]).toContain(
    "text/html"
  );
  expect(
    missingRevalidationResponse.headers()["content-location"]
  ).toBeUndefined();
  expect(missingRevalidationResponse.headers().link).toBeUndefined();

  const skillsIndexResponse = await request.get(
    "/.well-known/agent-skills/index.json"
  );
  expect(skillsIndexResponse.ok()).toBe(true);
  expect(skillsIndexResponse.headers()["content-type"]).toContain(
    "application/json"
  );
  expect(skillsIndexResponse.headers()["access-control-allow-origin"]).toBe(
    "*"
  );
  const skillsIndex = await skillsIndexResponse.json();
  const skillEntry = skillsIndex.skills[0];
  expect(skillEntry.name).toBe("astilba-cache-docs");

  const skillResponse = await request.get(skillEntry.url);
  expect(skillResponse.ok()).toBe(true);
  expect(skillResponse.headers()["content-type"]).toContain("text/markdown");
  const skillContent = await skillResponse.body();
  expect(skillEntry.digest).toBe(
    `sha256:${createHash("sha256").update(skillContent).digest("hex")}`
  );

  await page.goto("/cache/overview/");
  const copyMarkdown = page.getByRole("button", {
    name: "Copy Markdown",
  });

  await expect(copyMarkdown).toBeEnabled();
  await copyMarkdown.click();
  await expect(page.getByRole("status")).toHaveText("Page Markdown copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "# Overview"
  );
  await expect(copyMarkdown).toHaveAttribute("data-copy-state", "idle", {
    timeout: 3000,
  });

  await page.getByRole("button", { name: "Open in" }).click();
  await page.getByRole("menuitem", { name: "Copy Markdown link" }).click();
  await expect(page.getByRole("status")).toHaveText("Markdown link copied.");
  await expect(copyMarkdown).toHaveAttribute("data-copy-state", "idle");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toMatch(/\/cache\/overview\.md$/);
});

test("searches the production Pagefind index", async ({ page }) => {
  await page.goto("/cache/overview/");

  const searchButton = page.locator("[data-sidebar-search-trigger]");
  await expect(searchButton).toBeEnabled();
  await searchButton.click();

  const dialog = page.locator("site-search dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("textbox", { name: "Search" })
    .fill("Runtime architecture");
  await expect(
    dialog.getByRole("link", { name: /Runtime architecture/i }).first()
  ).toBeVisible();
  await dialog
    .getByRole("textbox", { name: "Search" })
    .fill("Documentation MCP");
  await expect(
    dialog.getByRole("link", { name: /Documentation MCP/i }).first()
  ).toBeVisible();
});

test("enforces CSP without blocking the interactive shell", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations?.push({
        blockedUri: event.blockedURI,
        effectiveDirective: event.effectiveDirective,
      });
    });
  });

  const response = await page.goto("/cache/overview/");
  const policy = response?.headers()["content-security-policy"] ?? "";

  expect(policy).toContain("default-src 'none'");
  expect(policy).toContain("script-src 'self' 'wasm-unsafe-eval'");
  expect(policy).not.toContain("'unsafe-eval'");
  expect(policy).not.toMatch(
    /(?:^|;)\s*script-src(?:-elem)?\b[^;]*'unsafe-inline'/
  );
  expect(policy).toContain("script-src-attr 'none'");
  expect(policy).toContain("frame-ancestors 'none'");

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.locator("[data-sidebar-search-trigger]").click();
  const search = page.getByRole("dialog", { name: "Search" });
  await search
    .getByRole("textbox", { name: "Search" })
    .fill("Runtime architecture");
  await expect(
    search.getByRole("link", { name: /Runtime architecture/i }).first()
  ).toBeVisible();

  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
});

test("registers a read-only WebMCP tool when the API is available", async ({
  page,
}) => {
  const markdownRequests: string[] = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith(".md")) {
      markdownRequests.push(pathname);
    }
  });

  await page.addInitScript(() => {
    window.__webMcpRegistrationMethods = [];
    window.__webMcpTools = [];
    Object.defineProperty(Document.prototype, "modelContext", {
      configurable: true,
      get() {
        return {
          registerTool: async (tool: WebMcpToolProbe) => {
            window.__webMcpRegistrationMethods?.push("document.registerTool");
            window.__webMcpTools?.push(tool);
          },
        };
      },
    });
    Object.defineProperty(window.navigator, "modelContext", {
      configurable: true,
      value: {
        provideContext: ({ tools }: { tools: WebMcpToolProbe[] }) => {
          window.__webMcpRegistrationMethods?.push("navigator.provideContext");
          window.__webMcpTools?.push(...tools);
        },
        registerTool: (tool: WebMcpToolProbe) => {
          window.__webMcpRegistrationMethods?.push("navigator.registerTool");
          window.__webMcpTools?.push(tool);
        },
      },
    });
  });

  await page.goto("/cache/overview/");
  await expect
    .poll(() => page.evaluate(() => window.__webMcpTools?.length ?? 0))
    .toBe(1);
  expect(await page.evaluate(() => window.__webMcpRegistrationMethods)).toEqual(
    ["document.registerTool"]
  );

  const tool = await page.evaluate(() => {
    const registered = window.__webMcpTools?.[0];

    return registered
      ? { annotations: registered.annotations, name: registered.name }
      : undefined;
  });
  expect(tool).toEqual({
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    name: "read_current_page_markdown",
  });

  const markdownChunks = await page.evaluate(async () => {
    const registered = window.__webMcpTools?.[0];
    const chunks: string[] = [];
    let expectedTotal: number | undefined;
    let offset: number | undefined = 0;

    while (offset !== undefined) {
      const chunk: string | undefined = await registered?.execute({
        offset,
      });
      if (!chunk) {
        break;
      }

      chunks.push(chunk);
      const range: RegExpMatchArray | null = chunk.match(
        /^Markdown characters (\d+)–(\d+) of (\d+)\.\n\n/
      );
      if (!range) {
        throw new Error("Markdown chunk metadata is missing.");
      }

      const start: number = Number(range[1]);
      const end: number = Number(range[2]);
      const total: number = Number(range[3]);
      if (
        ![start, end, total].every(Number.isSafeInteger) ||
        start !== offset ||
        end < start ||
        end > total ||
        (expectedTotal !== undefined && total !== expectedTotal)
      ) {
        throw new Error("Markdown chunk metadata is inconsistent.");
      }
      expectedTotal = total;

      const nextOffset: string | undefined = chunk.match(
        /\n\nNext offset: (\d+)\.$/
      )?.[1];
      if (nextOffset !== undefined) {
        const parsedOffset: number = Number(nextOffset);
        if (
          !Number.isSafeInteger(parsedOffset) ||
          parsedOffset !== end ||
          parsedOffset <= start
        ) {
          throw new Error("Markdown chunk traversal did not make progress.");
        }
        offset = parsedOffset;
      } else if (/\n\nEnd of page\.$/.test(chunk) && end === total) {
        offset = undefined;
      } else {
        throw new Error("Markdown chunk continuation is missing.");
      }
    }

    return chunks;
  });
  expect(markdownChunks.length).toBeGreaterThan(0);
  expect(markdownChunks.every((chunk) => chunk.length <= 1500)).toBe(true);
  expect(markdownChunks.join("\n")).toContain("# Overview");
  expect(markdownChunks.join("\n")).toContain(
    "For React applications, “server-side” means"
  );
  expect(markdownChunks.at(-1)).toMatch(/End of page\.$/);
  expect(markdownRequests).toEqual(["/cache/overview.md"]);

  const nextPageChunk = await page.evaluate(async () => {
    const markdownLink = document.querySelector<HTMLLinkElement>(
      'link[rel="alternate"][type="text/markdown"]'
    );
    markdownLink?.setAttribute("href", "/cache/quickstart.md");

    return window.__webMcpTools?.[0]?.execute({ offset: 0 });
  });
  expect(nextPageChunk).toContain("# Local quickstart");
  expect(markdownRequests).toEqual([
    "/cache/overview.md",
    "/cache/quickstart.md",
  ]);

  const cachedOverviewChunk = await page.evaluate(async () => {
    const markdownLink = document.querySelector<HTMLLinkElement>(
      'link[rel="alternate"][type="text/markdown"]'
    );
    markdownLink?.setAttribute("href", "/cache/overview.md");

    return window.__webMcpTools?.[0]?.execute({ offset: 0 });
  });
  expect(cachedOverviewChunk).toContain("# Overview");
  expect(markdownRequests).toEqual([
    "/cache/overview.md",
    "/cache/quickstart.md",
  ]);
});

test("falls back to legacy navigator.registerTool for WebMCP", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__webMcpRegistrationMethods = [];
    window.__webMcpTools = [];
    Object.defineProperty(Document.prototype, "modelContext", {
      configurable: true,
      get: () => undefined,
    });
    Object.defineProperty(window.navigator, "modelContext", {
      configurable: true,
      value: {
        provideContext: ({ tools }: { tools: WebMcpToolProbe[] }) => {
          window.__webMcpRegistrationMethods?.push("navigator.provideContext");
          window.__webMcpTools?.push(...tools);
        },
        registerTool: (tool: WebMcpToolProbe) => {
          window.__webMcpRegistrationMethods?.push("navigator.registerTool");
          window.__webMcpTools?.push(tool);
        },
      },
    });
  });

  await page.goto("/cache/overview/");
  await expect
    .poll(() => page.evaluate(() => window.__webMcpTools?.length ?? 0))
    .toBe(1);

  expect(await page.evaluate(() => window.__webMcpRegistrationMethods)).toEqual(
    ["navigator.registerTool"]
  );
  expect(
    await page.evaluate(() => window.__webMcpTools?.[0]?.annotations)
  ).toEqual({ readOnlyHint: true, untrustedContentHint: false });
});

test("falls back to legacy navigator.provideContext for WebMCP", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__webMcpRegistrationMethods = [];
    window.__webMcpTools = [];
    Object.defineProperty(Document.prototype, "modelContext", {
      configurable: true,
      get: () => undefined,
    });
    Object.defineProperty(window.navigator, "modelContext", {
      configurable: true,
      value: {
        provideContext: ({ tools }: { tools: WebMcpToolProbe[] }) => {
          window.__webMcpRegistrationMethods?.push("navigator.provideContext");
          window.__webMcpTools?.push(...tools);
        },
      },
    });
  });

  await page.goto("/cache/overview/");
  await expect
    .poll(() => page.evaluate(() => window.__webMcpTools?.length ?? 0))
    .toBe(1);

  expect(await page.evaluate(() => window.__webMcpRegistrationMethods)).toEqual(
    ["navigator.provideContext"]
  );
  expect(
    await page.evaluate(() => window.__webMcpTools?.[0]?.annotations)
  ).toEqual({ readOnlyHint: true, untrustedContentHint: false });
});

test("persists desktop sidebar disclosure state across navigation", async ({
  page,
}) => {
  await page.goto("/cache/overview/");

  const getStarted = page.getByRole("button", {
    name: "Get started",
    exact: true,
  });
  await getStarted.click();
  await expect(getStarted).toHaveAttribute("aria-expanded", "false");

  await page
    .locator("#starlight__sidebar")
    .getByRole("link", { name: "Invalidate cached data" })
    .click();
  await expect(page).toHaveURL(/\/cache\/tags-and-invalidation\/$/);
  await expect(
    page.getByRole("button", { name: "Get started", exact: true })
  ).toHaveAttribute("aria-expanded", "false");
});

test("targets the active product repository from the header", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Astilba on GitHub", exact: true })
  ).toHaveAttribute("href", "https://github.com/astilbahq");

  await page.goto("/cache/overview/");
  await expect(
    page.getByRole("link", {
      name: "Astilba Cache on GitHub",
      exact: true,
    })
  ).toHaveAttribute("href", "https://github.com/astilbahq/cache");
});

test("keeps sidebar controls in place while only navigation scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 480 });
  await page.goto("/cache/overview/");

  const sidebar = page.locator("#starlight__sidebar");
  const searchTrigger = page.locator("[data-sidebar-search-trigger]");
  const context = page.getByRole("group", {
    name: "Documentation context",
  });
  const navigation = page.locator("[data-docs-sidebar-scroll]");

  await expect(searchTrigger).toBeVisible();
  await expect(searchTrigger).toHaveCSS("position", "static");
  await expect(sidebar).toHaveCSS("overflow-y", "hidden");
  await expect(navigation).toHaveCSS("overflow-y", "scroll");
  await expect(navigation).toHaveCSS("mask-image", /linear-gradient/);
  await expect
    .poll(() =>
      navigation.evaluate(
        (element) => element.scrollHeight > element.clientHeight
      )
    )
    .toBe(true);
  await expect(navigation).toHaveAttribute("data-overflow-y-end", "");
  await expect(navigation).not.toHaveAttribute("data-overflow-y-start");

  const scrollArea = page.locator("[data-docs-sidebar-scroll-root]");
  const scrollThumb = scrollArea.locator("[data-docs-sidebar-scroll-thumb]");
  const scrollBar = scrollArea.locator("[data-docs-sidebar-scrollbar]");
  await expect(scrollThumb).toHaveCount(1);
  await expect(scrollBar).toHaveCSS("opacity", "0");
  await expect(scrollBar).toHaveCSS("pointer-events", "none");
  await navigation.hover();
  await expect(scrollBar).toHaveCSS("opacity", "1");
  await expect(scrollBar).toHaveCSS("pointer-events", "auto");
  await page.locator("main").hover();
  await expect(scrollBar).toHaveCSS("opacity", "0");
  await expect(scrollBar).toHaveCSS("pointer-events", "none");
  await page.emulateMedia({ forcedColors: "active" });
  await expect(navigation).toHaveCSS("mask-image", "none");
  await expect(scrollBar).toHaveCSS("opacity", "1");
  await expect(scrollBar).toHaveCSS("pointer-events", "auto");
  await expect(scrollThumb).toHaveCSS("forced-color-adjust", "none");
  await expect(scrollThumb).not.toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)"
  );
  await page.emulateMedia({ forcedColors: "none" });
  await expect(navigation).toHaveCSS("mask-image", /linear-gradient/);
  await expect(scrollBar).toHaveCSS("opacity", "0");
  await expect(scrollBar).toHaveCSS("pointer-events", "none");

  await navigation.evaluate((element) => {
    element.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, deltaY: 48 })
    );
    element.scrollTop += 48;
  });
  await expect(scrollBar).toHaveAttribute("data-scrolling", "");
  await expect(scrollBar).toHaveCSS("opacity", "1");
  await expect(scrollBar).toHaveCSS("pointer-events", "auto");
  await expect(scrollBar).not.toHaveAttribute("data-scrolling", "", {
    timeout: 1500,
  });
  await expect(scrollBar).toHaveCSS("opacity", "0");
  await expect(scrollBar).toHaveCSS("pointer-events", "none");

  const searchBefore = await searchTrigger.boundingBox();
  const contextBefore = await context.boundingBox();
  await navigation.evaluate((element) => {
    element.scrollTop = 120;
  });
  await expect
    .poll(() => navigation.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect(navigation).toHaveAttribute("data-overflow-y-start", "");
  const searchAfter = await searchTrigger.boundingBox();
  const contextAfter = await context.boundingBox();

  if (!(searchBefore && contextBefore && searchAfter && contextAfter)) {
    throw new Error("Sidebar controls must have measurable layout boxes.");
  }

  expect(searchAfter.y).toBeCloseTo(searchBefore.y, 1);
  expect(contextAfter.y).toBeCloseTo(contextBefore.y, 1);

  await navigation.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(navigation).not.toHaveAttribute("data-overflow-y-end");
  await expect(navigation).toHaveAttribute("data-overflow-y-start", "");

  await navigation.focus();
  await expect(navigation).toHaveCSS("outline-style", "none");
  await expect(scrollArea).toHaveCSS("outline-style", "solid");
  await expect(scrollBar).toHaveCSS("opacity", "1");
  await expect(scrollBar).toHaveCSS("pointer-events", "auto");
  await page.keyboard.press("Tab");
  await expect(
    navigation.getByRole("button", { name: "Get started", exact: true })
  ).toBeFocused();
  await expect(scrollBar).toHaveCSS("opacity", "1");

  await searchTrigger.click();
  await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(searchTrigger).toBeFocused();
});

test("keeps native header search available without a sidebar", async ({
  page,
}) => {
  const response = await page.goto("/missing/");
  expect(response?.status()).toBe(404);

  const searchTrigger = page.locator("site-search > button[data-open-modal]");
  await expect(searchTrigger).toBeVisible();
  await searchTrigger.click();
  await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
});

test("switches themes and opens mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cache/quickstart/");

  const root = page.locator("html");
  const initialTheme = await root.getAttribute("data-theme");
  const nextTheme = initialTheme === "light" ? "dark" : "light";
  const themeToggle = page.locator("[data-theme-toggle-button]");
  await themeToggle.click();
  await expect(root).toHaveAttribute("data-theme", nextTheme);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("starlight-theme")))
    .toBe(nextTheme);
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", nextTheme);

  const menuButton = page.locator('button[aria-controls="starlight__sidebar"]');
  const menuBox = await menuButton.boundingBox();
  expect(menuBox?.x ?? 0).toBeGreaterThan(300);
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#starlight__sidebar")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Invalidate cached data" })
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(menuButton).toBeFocused();
});

test("has no automatically detectable accessibility violations", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("starlight-theme", "light");
  });
  await page.goto("/cache/overview/");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Open in" }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("opacity", "1");
  await expectNoAxeViolations(page);
  await page.keyboard.press("Escape");

  const searchButton = page.locator("[data-sidebar-search-trigger]");
  await searchButton.click();
  const searchDialog = page.getByRole("dialog", { name: "Search" });
  await expect(searchDialog).toBeVisible();
  await expect(searchDialog).toHaveCSS("opacity", "1");
  await expectNoAxeViolations(page);
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const menuButton = page.locator('button[aria-controls="starlight__sidebar"]');
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expectNoAxeViolations(page);
});

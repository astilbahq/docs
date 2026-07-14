import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { createHash } from "node:crypto";

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
    __webMcpTools?: WebMcpToolProbe[];
  }
}

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

  const negotiatedMarkdownResponse = await request.get(
    "/cache/overview/",
    { headers: { Accept: "text/markdown" } }
  );
  expect(negotiatedMarkdownResponse.ok()).toBe(true);
  expect(negotiatedMarkdownResponse.headers()["content-type"]).toContain(
    "text/markdown"
  );
  expect(negotiatedMarkdownResponse.headers()["content-location"]).toBe(
    "/cache/overview.md"
  );
  expect(negotiatedMarkdownResponse.headers()["content-signal"]).toBe(
    "ai-train=no, search=yes, ai-input=yes"
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

  const htmlResponse = await request.get("/cache/overview/", {
    headers: { Accept: "text/html, text/markdown;q=0" },
  });
  expect(htmlResponse.headers()["content-type"]).toContain("text/html");
  expect(htmlResponse.headers().vary).toContain("Accept");

  const preferredHtmlResponse = await request.get("/cache/overview/", {
    headers: { Accept: "text/html;q=1, text/markdown;q=0.1" },
  });
  expect(preferredHtmlResponse.headers()["content-type"]).toContain(
    "text/html"
  );

  const markdownResponse = await request.get("/cache/overview.md");
  expect(markdownResponse.ok()).toBe(true);
  expect(markdownResponse.headers()["content-type"]).toContain(
    "text/markdown"
  );
  const markdown = await markdownResponse.text();
  expect(markdown).toContain("# Overview");
  expect(markdown).toContain(
    "For React applications, “server-side” means"
  );

  const missingMarkdownResponse = await request.get("/missing/", {
    headers: { Accept: "text/markdown" },
  });
  expect(missingMarkdownResponse.status()).toBe(404);
  expect(missingMarkdownResponse.headers()["content-type"]).toContain(
    "text/html"
  );

  const missingDirectResponse = await request.get("/missing.md");
  const missingEtag = missingDirectResponse.headers().etag;
  expect(missingDirectResponse.status()).toBe(404);
  expect(missingEtag).toBeTruthy();

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

  await copyMarkdown.click();
  await expect(page.getByRole("status")).toHaveText(
    "Page Markdown copied."
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "# Overview"
  );
  await expect(copyMarkdown).toHaveAttribute("data-copy-state", "idle", {
    timeout: 3000,
  });

  await page.getByRole("button", { name: "Open in" }).click();
  await page.getByRole("menuitem", { name: "Copy Markdown link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Markdown link copied."
  );
  await expect(copyMarkdown).toHaveAttribute("data-copy-state", "idle");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toMatch(/\/cache\/overview\.md$/);
});

test("searches the production Pagefind index", async ({ page }) => {
  await page.goto("/cache/overview/");

  const searchButton = page.locator(
    "site-search > button[data-open-modal]"
  );
  await expect(searchButton).toBeEnabled();
  await searchButton.click();

  const dialog = page.locator("site-search dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Search" }).fill(
    "Runtime architecture"
  );
  await expect(
    dialog.getByRole("link", { name: /Runtime architecture/i }).first()
  ).toBeVisible();
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
    window.__webMcpTools = [];
    Object.defineProperty(Document.prototype, "modelContext", {
      configurable: true,
      get() {
        return {
          registerTool: async (tool: WebMcpToolProbe) => {
            window.__webMcpTools?.push(tool);
          },
        };
      },
    });
  });

  await page.goto("/cache/overview/");
  await expect
    .poll(() => page.evaluate(() => window.__webMcpTools?.length ?? 0))
    .toBe(1);

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
  expect(nextPageChunk).toContain("# Preview walkthrough");
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

test("persists desktop sidebar disclosure state across navigation", async ({
  page,
}) => {
  await page.goto("/cache/overview/");

  const start = page.getByRole("button", { name: "Start", exact: true });
  await start.click();
  await expect(start).toHaveAttribute("aria-expanded", "false");

  await page
    .locator("#starlight__sidebar")
    .getByRole("link", { name: "Invalidating data" })
    .click();
  await expect(page).toHaveURL(/\/cache\/tags-and-invalidation\/$/);
  await expect(
    page.getByRole("button", { name: "Start", exact: true })
  ).toHaveAttribute("aria-expanded", "false");
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

  const menuButton = page.locator(
    'button[aria-controls="starlight__sidebar"]'
  );
  const menuBox = await menuButton.boundingBox();
  expect(menuBox?.x ?? 0).toBeGreaterThan(300);
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#starlight__sidebar")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Invalidating data" })
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

  const searchButton = page.locator(
    "site-search > button[data-open-modal]"
  );
  await searchButton.click();
  const searchDialog = page.getByRole("dialog", { name: "Search" });
  await expect(searchDialog).toBeVisible();
  await expect(searchDialog).toHaveCSS("opacity", "1");
  await expectNoAxeViolations(page);
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const menuButton = page.locator(
    'button[aria-controls="starlight__sidebar"]'
  );
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expectNoAxeViolations(page);
});

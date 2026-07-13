import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

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

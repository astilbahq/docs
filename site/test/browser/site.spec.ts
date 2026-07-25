import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const expectNoAxeViolations = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
};

test("the public home distinguishes the released and preview products", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Infrastructure that tells you where its guarantees end.",
    })
  ).toBeVisible();
  await expect(page.getByText("create-astilba", { exact: true })).toBeVisible();
  await expect(page.getByText("0.1.2 is released")).toBeVisible();
  await expect(
    page.getByText("Cache remains a development preview")
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create a project" }).first()
  ).toHaveAttribute("href", "/docs/create/quickstart/");
  await expect(
    page.getByRole("link", { name: "View docs source" })
  ).toHaveAttribute("href", "https://github.com/astilbahq/docs");
  await expect(
    page.locator('a[href*="github.com/astilbahq/cache"]')
  ).toHaveCount(0);
  await expectNoAxeViolations(page);
});

test("the Create page presents the released CLI boundary", async ({ page }) => {
  await page.goto("/create/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Start with a complete project, not a pile of choices.",
    })
  ).toBeVisible();
  await expect(page.getByText("create-astilba", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Four recipe v2 contracts", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create a project" })
  ).toHaveAttribute("href", "/docs/create/quickstart/");
  await expect(
    page.getByRole("link", { name: "View the source" })
  ).toHaveAttribute("href", "https://github.com/astilbahq/create");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "The CLI and four recipes are released",
    })
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("the Cache page never presents an installation path", async ({ page }) => {
  await page.goto("/cache/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Cache expensive server work without hiding the hard parts.",
    })
  ).toBeVisible();
  await expect(page.getByText("No npm package")).toBeVisible();
  await expect(page.getByText(/pnpm add|npm install/)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Inspect the docs source" })
  ).toHaveAttribute("href", "https://github.com/astilbahq/docs");
  await expect(
    page.locator('a[href*="github.com/astilbahq/cache"]')
  ).toHaveCount(0);
  await expectNoAxeViolations(page);
});

test("theme state persists across public-site pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to light theme" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("starlight-theme")))
    .toBe("light");

  await page.goto("/create/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the mobile menu restores focus and the layout does not overflow", async ({
  page,
}) => {
  await page.goto("/");

  const opener = page.getByRole("button", { name: "Open navigation" });

  if (await opener.isVisible()) {
    await opener.click();
    await expect(
      page.getByRole("dialog", { name: "Navigation" })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  } else {
    await expect(opener).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: "Primary" })
    ).toBeVisible();
  }

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
});

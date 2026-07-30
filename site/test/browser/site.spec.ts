import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

declare global {
  interface Window {
    __setAstilbaFinePointer: (value: boolean) => void;
  }
}

const expectNoAxeViolations = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
};

const waitForVisualTransitions = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running")
        .map((animation) => animation.finished.catch(() => undefined))
    );
  });
};

const resolveCssColor = async (
  page: Page,
  customProperty: string
): Promise<string> => {
  const value = await page.evaluate(
    (property) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(property)
        .trim(),
    customProperty
  );

  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value);
  if (!hex) {
    return value;
  }

  const [, red, green, blue] = hex;
  return `rgb(${Number.parseInt(red, 16)}, ${Number.parseInt(
    green,
    16
  )}, ${Number.parseInt(blue, 16)})`;
};

test("right-clicking the Astilba brand reveals the interface showcase", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const query = "(hover: hover) and (pointer: fine)";
    const originalMatchMedia = window.matchMedia.bind(window);
    const finePointer = originalMatchMedia(query);
    let matches = false;

    Object.defineProperty(finePointer, "matches", {
      configurable: true,
      get: () => matches,
    });
    window.matchMedia = (value) =>
      value === query ? finePointer : originalMatchMedia(value);
    window.__setAstilbaFinePointer = (value) => {
      matches = value;
    };
  });
  await page.route("https://ui.astilba.com/", async (route) => {
    await route.fulfill({
      body: "<title>Astilba Interface</title>",
      contentType: "text/html",
      status: 200,
    });
  });
  await page.goto("/");

  const brand = page.getByRole("link", { name: "Astilba home" });
  await expect(brand).toHaveAttribute("href", "/");
  await brand.click({ button: "right" });
  await expect(page).toHaveURL("/");

  await page.evaluate(() => {
    window.__setAstilbaFinePointer(true);
  });
  await brand.click({ button: "right" });

  await expect(page).toHaveURL("https://ui.astilba.com/");
});

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
  await expect(page.getByText("0.3.0 is released")).toBeVisible();
  await expect(page.getByText("0.1.0 is a public alpha")).toBeVisible();
  await expect(
    page.getByText("Cache remains a development preview")
  ).toBeVisible();
  const configure = page
    .getByRole("link", { name: "Configure a project" })
    .first();
  await expect(configure).toHaveAttribute("href", "/create/new/");
  await configure.hover();
  await expect(configure).toHaveCSS(
    "background-color",
    await resolveCssColor(page, "--astilba-colors-surface-action-primary-hover")
  );
  await expect(configure).toHaveCSS(
    "color",
    await resolveCssColor(page, "--astilba-colors-ink-on-primary")
  );
  await expect(
    page.getByRole("link", { name: "View docs source" })
  ).toHaveAttribute("href", "https://github.com/astilbahq/docs");
  await expect(
    page.locator('a[href*="github.com/astilbahq/cache"]')
  ).toHaveCount(0);
  await expectNoAxeViolations(page);
});

test("the Env page presents the public-alpha boundary", async ({ page }) => {
  await page.goto("/env/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Configure once; expose only what each artifact needs.",
    })
  ).toBeVisible();
  await expect(page.getByText("@astilba/env", { exact: true })).toBeVisible();
  await expect(
    page.getByText("0.1.0 · public alpha · local-first")
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View the source" })
  ).toHaveAttribute("href", "https://github.com/astilbahq/env");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Public for evaluation; deliberately not stable",
    })
  ).toBeVisible();
  await expect(page.getByText(/@astilba\/env\/next/)).toHaveCount(0);
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
    page.getByText("Schema v1 · four recipe v2 contracts", {
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Configure a project" })
  ).toHaveAttribute("href", "/create/new/");
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

test("the Create configurator assembles and shares a released command", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/create/new/?private=do-not-share");

  await expect(
    page.getByRole("heading", { level: 1, name: "Configure a project" })
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /TypeScript library/ })
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /React \+ Vite application/ })
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /Astro static site/ })
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /Cloudflare Worker service/ })
  ).toBeVisible();

  const copyCommand = page.locator("[data-copy-command]");
  const copyConfiguration = page.locator("[data-copy-configuration]");
  const command = page.locator("[data-create-command]");
  const directory = page.getByLabel("Directory");
  await expect(directory).toHaveAttribute(
    "aria-describedby",
    "destination-help"
  );
  await expect(directory).not.toHaveAttribute("aria-invalid");
  await expect(copyCommand).toHaveAccessibleName("Copy command");
  await expect(copyConfiguration).toHaveAccessibleName(
    "Copy configuration link"
  );
  await expect(copyCommand).toBeDisabled();
  await expect(copyConfiguration).toBeDisabled();

  await page
    .locator(".recipe-option")
    .filter({ hasText: "React + Vite application" })
    .click();
  await directory.fill("projects/my app");
  await page.getByLabel("Description").fill("It's a useful application.");
  await page.getByLabel("GitHub owner").fill("astilbahq");

  for (const invalidDestination of ["../escape", "CON", ".git"]) {
    await directory.fill(invalidDestination);
    await expect(copyCommand).toBeDisabled();
    await expect(page.locator("[data-destination-error]")).toBeVisible();
    await expect(directory).toHaveAttribute("aria-invalid", "true");
    await expect(directory).toHaveAttribute(
      "aria-describedby",
      "destination-help destination-error"
    );
    await expect(command).toContainText(
      "Destination must be a normalized portable relative path"
    );
  }
  await directory.fill("projects/my app");
  await expect(page.locator("[data-destination-error]")).toBeHidden();
  await expect(directory).toHaveAttribute(
    "aria-describedby",
    "destination-help"
  );
  await expect(directory).not.toHaveAttribute("aria-invalid");

  await page.getByLabel("Description").fill(" leading whitespace");
  await expect(copyCommand).toBeDisabled();
  await expect(page.locator("[data-description-error]")).toBeVisible();
  await expect(page.getByLabel("Description")).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  await expect(command).toContainText(
    "Description must not start or end with whitespace"
  );
  await page.getByLabel("Description").fill("It's a useful application.");

  await page.getByLabel("GitHub owner").fill("foo_");
  await expect(copyCommand).toBeDisabled();
  await expect(page.locator("[data-github-owner-error]")).toBeVisible();
  await expect(page.getByLabel("GitHub owner")).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  await expect(command).toContainText(
    "GitHub owner is not a supported account name"
  );
  await page.getByLabel("GitHub owner").fill("astilbahq");

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await skipLink.focus();
  await skipLink.press("Enter");
  await expect(page).toHaveURL(/#main-content$/u);
  await expect(page.getByLabel("Directory")).toHaveValue("projects/my app");
  await expect(page.getByLabel("Description")).toHaveValue(
    "It's a useful application."
  );
  await expect(copyCommand).toBeEnabled();

  await page.goBack();
  await expect(page).not.toHaveURL(/#main-content$/u);
  await expect(page.getByLabel("Directory")).toHaveValue("projects/my app");
  await expect(page.getByLabel("Description")).toHaveValue(
    "It's a useful application."
  );
  await expect(copyCommand).toBeEnabled();
  await page.goForward();
  await expect(page).toHaveURL(/#main-content$/u);
  await expect(page.getByLabel("Description")).toHaveValue(
    "It's a useful application."
  );

  const formUrl = page.url();
  await page.getByLabel("GitHub owner").press("Enter");
  await expect(page).toHaveURL(formUrl);

  await expect(command).toHaveText(
    "npm create astilba@0.3.0 -- --recipe=react-vite-spa '--description=It'\"'\"'s a useful application.' --github-owner=astilbahq --git --install -- 'projects/my app'"
  );
  await expect(copyCommand).toBeEnabled();

  const buttonSizeBefore = await copyCommand.boundingBox();
  await copyCommand.click();
  await expect(copyCommand).toHaveAttribute("data-copy-state", "copied");
  await expect(copyCommand).toContainText("Copied!");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(await command.textContent());
  const buttonSizeAfter = await copyCommand.boundingBox();
  expect(buttonSizeAfter?.height).toBe(buttonSizeBefore?.height);
  expect(buttonSizeAfter?.width).toBe(buttonSizeBefore?.width);

  await page
    .locator(".shell-selector label")
    .filter({ hasText: "PowerShell" })
    .click();
  await expect(command).toHaveText(
    "npm create astilba@0.3.0 -- '--recipe=react-vite-spa' '--description=It''s a useful application.' '--github-owner=astilbahq' --git --install -- 'projects/my app'"
  );

  const originalUrl = page.url();
  await copyConfiguration.click();
  await expect(copyConfiguration).toHaveAttribute("data-copy-state", "copied");
  await expect(page).toHaveURL(originalUrl);
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  const parsedSharedUrl = new URL(sharedUrl);
  expect(parsedSharedUrl.pathname).toBe("/create/new/");
  expect(parsedSharedUrl.search).toBe("");
  expect(parsedSharedUrl.hash).toContain("v=1");
  expect(parsedSharedUrl.hash).toContain("generatorVersion=0.3.0");
  expect(parsedSharedUrl.hash).toContain("recipe=react-vite-spa");
  expect(parsedSharedUrl.hash).toContain("recipeVersion=2");
  expect(parsedSharedUrl.hash).toContain("shell=powershell");

  await page.goto(sharedUrl);
  await expect(page.locator("[data-configurator-status]")).toHaveText(
    "Shared configuration loaded."
  );
  await expect(
    page.getByRole("radio", { name: /React \+ Vite application/ })
  ).toBeChecked();
  await expect(page.getByRole("radio", { name: "PowerShell" })).toBeChecked();
  await expect(page.getByLabel("Directory")).toHaveValue("projects/my app");
  await expect(command).toHaveText(
    "npm create astilba@0.3.0 -- '--recipe=react-vite-spa' '--description=It''s a useful application.' '--github-owner=astilbahq' --git --install -- 'projects/my app'"
  );

  const secondSharedUrl = new URL(sharedUrl);
  const secondParameters = new URLSearchParams(secondSharedUrl.hash.slice(1));
  secondParameters.set("recipe", "astro-static-site");
  secondParameters.set("destination", "second-project");
  secondParameters.set("description", "A second shared configuration.");
  secondSharedUrl.hash = secondParameters.toString();
  await page.goto(secondSharedUrl.href);
  await expect(
    page.getByRole("radio", { name: /Astro static site/ })
  ).toBeChecked();
  await expect(page.getByLabel("Directory")).toHaveValue("second-project");
  await expect(page.getByLabel("Description")).toHaveValue(
    "A second shared configuration."
  );

  await page.goto("/create/new/");
  await expect(
    page.getByRole("radio", { name: /Astro static site/ })
  ).not.toBeChecked();
  await expect(page.getByLabel("Directory")).toHaveValue("my-project");
  await expect(page.getByLabel("Description")).toHaveValue("");
  await expect(
    page.getByRole("radio", { name: "Shell", exact: true })
  ).toBeChecked();
  await expect(copyCommand).toBeDisabled();
  await expect(page.locator("[data-share-fallback]")).toBeHidden();

  await page.goBack();
  await expect(
    page.getByRole("radio", { name: /Astro static site/ })
  ).toBeChecked();
  await expect(page.getByLabel("Directory")).toHaveValue("second-project");

  const invalidSharedUrl = new URL(secondSharedUrl);
  const invalidParameters = new URLSearchParams(invalidSharedUrl.hash.slice(1));
  invalidParameters.set("generatorVersion", "9.9.9");
  invalidSharedUrl.hash = invalidParameters.toString();
  await page.goto(invalidSharedUrl.href);
  await expect(page.locator("[data-configurator-status]")).toHaveText(
    "The shared configuration targets a different Create release."
  );
  await expect(page.getByLabel("Directory")).toHaveValue("my-project");
  await expect(
    page.getByRole("radio", { name: "Shell", exact: true })
  ).toBeChecked();
  await expect(copyCommand).toBeDisabled();

  await page.goBack();
  await expect(page.getByLabel("Directory")).toHaveValue("second-project");
  await expect(page.getByRole("radio", { name: "PowerShell" })).toBeChecked();
  await expect(copyCommand).toBeEnabled();
  await page.goForward();
  await expect(page.getByLabel("Directory")).toHaveValue("my-project");
  await expect(
    page.getByRole("radio", { name: "Shell", exact: true })
  ).toBeChecked();
  await expect(copyCommand).toBeDisabled();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await waitForVisualTransitions(page);
  await expectNoAxeViolations(page);
});

test("the Create configurator provides keyboard-usable fallbacks when clipboard access fails", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error("Clipboard unavailable")),
      },
    });
  });
  await page.goto("/create/new/");

  await page
    .locator(".recipe-option")
    .filter({ hasText: "TypeScript library" })
    .click();
  await page.getByLabel("Description").fill("A useful library.");
  await page.getByLabel("GitHub owner").fill("astilbahq");

  const command = page.locator("[data-create-command]");
  await expect(page.locator("[data-copy-command]")).not.toHaveAttribute(
    "data-disabled"
  );
  await expect(page.locator("[data-copy-configuration]")).not.toHaveAttribute(
    "data-disabled"
  );
  await page.locator("[data-copy-command]").click();
  await expect(command).toBeFocused();
  await expect(page.locator("[data-configurator-status]")).toHaveText(
    "Clipboard access failed. The command is selected above."
  );
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe(await command.textContent());

  await page.locator("[data-copy-configuration]").click();

  const fallback = page.locator("[data-share-fallback]");
  const fallbackInput = page.locator("[data-share-fallback-input]");
  await expect(fallback).toBeVisible();
  await expect(fallbackInput).toBeFocused();
  await expect(fallbackInput).toHaveValue(/\/create\/new\/#v=1&/u);
  await expect(page.locator("[data-configurator-status]")).toHaveText(
    "Clipboard access failed. The configuration link is selected above."
  );
  const selection = await fallbackInput.evaluate((input) => ({
    end: (input as HTMLInputElement).selectionEnd,
    length: (input as HTMLInputElement).value.length,
    start: (input as HTMLInputElement).selectionStart,
  }));
  expect(selection).toEqual({
    end: selection.length,
    length: selection.length,
    start: 0,
  });

  await page
    .locator(".shell-selector label")
    .filter({ hasText: "PowerShell" })
    .click();
  await expect(fallback).toBeHidden();
  await expect(fallbackInput).toHaveValue("");

  await page.locator("[data-copy-configuration]").click();
  await expect(fallback).toBeVisible();
  await expect(fallbackInput).toHaveValue(/shell=powershell/u);
  await expectNoAxeViolations(page);
});

test("theme state persists across public-site pages", async ({ page }) => {
  await page.goto("/");
  const mobileMenu = page.locator("[data-mobile-menu-open]");

  await expect(mobileMenu).toHaveCSS("inline-size", "40px");
  await expect(mobileMenu).toHaveCSS("block-size", "40px");
  await expect(mobileMenu).toHaveCSS("padding-inline-start", "0px");
  await expect(mobileMenu).toHaveCSS("padding-inline-end", "0px");
  await expect(mobileMenu.locator("svg")).toHaveCSS("width", "18px");
  await expect(mobileMenu.locator("svg")).toHaveCSS("height", "18px");
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

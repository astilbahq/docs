// @ts-check
import { defineConfig } from "astro/config";

const DEPLOYED_SITE_ORIGIN = "https://astilba.com";
const siteValue = process.env.ASTILBA_SITE;
const siteUrl = siteValue ? new URL(siteValue) : undefined;

if (siteUrl && !["http:", "https:"].includes(siteUrl.protocol)) {
  throw new Error("ASTILBA_SITE must use the http or https protocol.");
}

if (
  siteUrl &&
  (siteUrl.username ||
    siteUrl.password ||
    siteUrl.pathname !== "/" ||
    siteUrl.search ||
    siteUrl.hash)
) {
  throw new Error(
    "ASTILBA_SITE must be a public origin without credentials, a path, a query, or a fragment."
  );
}

if (siteUrl && siteUrl.origin !== DEPLOYED_SITE_ORIGIN) {
  throw new Error(
    `ASTILBA_SITE must use the canonical deployed origin ${DEPLOYED_SITE_ORIGIN}.`
  );
}

const site = siteUrl?.origin;

/** @type {import("astro").AstroIntegration} */
const requireSite = {
  name: "astilba-require-site",
  hooks: {
    "astro:config:setup"({ command }) {
      if (command === "build" && !site) {
        throw new Error(
          "ASTILBA_SITE is required for production builds so canonical URLs cannot be generated with the wrong origin."
        );
      }
    },
  },
};

export default defineConfig({
  site,
  integrations: [requireSite],
  build: {
    inlineStylesheets: "never",
  },
  trailingSlash: "always",
});

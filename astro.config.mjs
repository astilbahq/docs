// @ts-check
import { copyFile, readFile } from "node:fs/promises";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";
import starlightLlmsTxt from "starlight-llms-txt";

import { docsProducts, docsSidebar } from "./src/docs/catalog.ts";
import { siteDocsPages } from "./src/docs/site-pages.ts";
import {
  addDocsSitemapLastModified,
  createDocsSitemapLastModified,
} from "./src/docs/sitemap.ts";

// starlight-llms-txt needs the deployed origin to generate canonical links.
const DEPLOYED_DOCS_ORIGIN = "https://docs.astilba.com";
const siteValue = process.env.ASTILBA_DOCS_SITE;
const siteUrl = siteValue ? new URL(siteValue) : undefined;

if (siteUrl && !["http:", "https:"].includes(siteUrl.protocol)) {
  throw new Error("ASTILBA_DOCS_SITE must use the http or https protocol.");
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
    "ASTILBA_DOCS_SITE must be a public origin without credentials, a path, a query, or a fragment."
  );
}

if (siteUrl && siteUrl.origin !== DEPLOYED_DOCS_ORIGIN) {
  throw new Error(
    `ASTILBA_DOCS_SITE must use the canonical deployed origin ${DEPLOYED_DOCS_ORIGIN}.`
  );
}

const site = siteUrl?.origin;
const sitemapLastModified = site ? createDocsSitemapLastModified() : new Map();

/** @type {import("astro").AstroIntegration} */
const requireDocsSite = {
  name: "astilba-require-docs-site",
  hooks: {
    "astro:config:setup"({ command }) {
      if (command === "build" && !site) {
        throw new Error(
          "ASTILBA_DOCS_SITE is required for production builds so canonical and agent-readable URLs cannot be generated with the wrong origin."
        );
      }
    },
  },
};

/** @type {import("astro").AstroIntegration} */
const publishSingleSitemap = {
  name: "astilba-publish-single-sitemap",
  hooks: {
    async "astro:build:done"({ dir }) {
      if (!site) {
        return;
      }

      const sitemapIndex = await readFile(
        new URL("sitemap-index.xml", dir),
        "utf8"
      );
      const childLocations = [
        ...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g),
      ].map((match) => match[1]);
      const expectedChild = new URL("/sitemap-0.xml", site).href;

      if (childLocations.length !== 1 || childLocations[0] !== expectedChild) {
        throw new Error(
          "The direct sitemap requires exactly one generated sitemap child."
        );
      }

      await copyFile(
        new URL("sitemap-0.xml", dir),
        new URL("sitemap.xml", dir)
      );
    },
  },
};

const docsPageOrder = docsProducts.flatMap((product) =>
  product.versions.flatMap((version) =>
    version.sections.flatMap((section) =>
      section.items.map((page) => `${version.basePath}/${page.slug}`)
    )
  )
);
const sitePageOrder = siteDocsPages.map(({ id }) => id);

export default defineConfig({
  site,
  integrations: [
    requireDocsSite,
    react(),
    sitemap({
      serialize(item) {
        return addDocsSitemapLastModified(item, sitemapLastModified);
      },
    }),
    starlight({
      title: "Astilba",
      description: "Documentation for Astilba infrastructure libraries.",
      favicon: "/favicon.svg",
      head: site
        ? [
            {
              tag: "link",
              attrs: {
                href: new URL("/sitemap.xml", site).href,
                rel: "sitemap",
              },
            },
          ]
        : [],
      logo: {
        dark: "./src/assets/astilba-logomark-light.svg",
        light: "./src/assets/astilba-logomark-dark.svg",
      },
      social: [
        {
          icon: "github",
          label: "Astilba on GitHub",
          href: "https://github.com/astilbahq",
        },
      ],
      customCss: [
        "@fontsource-variable/inter",
        "@fontsource-variable/geist",
        "@fontsource-variable/jetbrains-mono",
        "./src/styles/panda.css",
        "./src/styles/starlight.css",
      ],
      components: {
        Banner: "./src/components/VersionBanner.astro",
        Header: "./src/components/Header.astro",
        Head: "./src/components/Head.astro",
        MobileMenuToggle: "./src/components/MobileMenuToggle.astro",
        PageTitle: "./src/components/PageTitle.astro",
        Sidebar: "./src/components/Sidebar.astro",
      },
      lastUpdated: false,
      plugins: [
        starlightLinksValidator(),
        ...(site
          ? [
              starlightLlmsTxt({
                details:
                  "Astilba Cache is an unreleased preview without a supported installation path. Treat its examples as API previews, not setup instructions.",
                optionalLinks: [
                  {
                    label: "Astilba documentation MCP",
                    url: `${DEPLOYED_DOCS_ORIGIN}/mcp`,
                    description:
                      "Read-only Streamable HTTP endpoint for searching and reading the published documentation corpus.",
                  },
                ],
                customSets: [
                  {
                    label: "Astilba Cache",
                    description:
                      "Unreleased preview documentation for Astilba's TypeScript caching library. The package is not installable yet.",
                    paths: ["cache/**"],
                  },
                ],
                promote: [...sitePageOrder, ...docsPageOrder],
              }),
            ]
          : []),
      ],
      routeMiddleware: "./src/docs/route-middleware.ts",
      sidebar: docsSidebar,
    }),
    publishSingleSitemap,
  ],
});

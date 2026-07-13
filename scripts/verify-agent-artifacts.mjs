import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const siteValue = process.env.ASTILBA_DOCS_SITE;

if (!siteValue) {
  throw new Error(
    "[agent-artifacts] ASTILBA_DOCS_SITE is required to verify canonical URLs."
  );
}

const site = new URL(siteValue);
const dist = resolve(process.cwd(), "dist");

const readArtifact = async (relativePath) => {
  try {
    return await readFile(resolve(dist, relativePath), "utf8");
  } catch (error) {
    throw new Error(
      `[agent-artifacts] Missing or unreadable dist/${relativePath}.`,
      { cause: error }
    );
  }
};

const assertIncludes = (artifact, content, expected) => {
  if (!content.includes(expected)) {
    throw new Error(
      `[agent-artifacts] dist/${artifact} does not include ${JSON.stringify(expected)}.`
    );
  }
};

const assertLink = (html, rel, href) => {
  const linkTags = html.match(/<link\b[^>]*>/g) ?? [];
  const found = linkTags.some(
    (tag) => tag.includes(`rel="${rel}"`) && tag.includes(`href="${href}"`)
  );

  if (!found) {
    throw new Error(
      `[agent-artifacts] HTML is missing a rel=${JSON.stringify(rel)} link to ${href}.`
    );
  }
};

const requiredArtifacts = [
  "_headers",
  "_llms-txt/astilba-cache.txt",
  "cache/overview.md",
  "cache/overview/index.html",
  "llms-full.txt",
  "llms-small.txt",
  "llms.txt",
  "pagefind/pagefind.js",
  "robots.txt",
  "sitemap-0.xml",
  "sitemap-index.xml",
];

const artifacts = new Map();

for (const artifact of requiredArtifacts) {
  artifacts.set(artifact, await readArtifact(artifact));
}

const staticHeaders = artifacts.get("_headers");
assertIncludes("_headers", staticHeaders, "/*.md");
assertIncludes(
  "_headers",
  staticHeaders,
  "Content-Type: text/markdown; charset=utf-8"
);
assertIncludes(
  "_headers",
  staticHeaders,
  "X-Content-Type-Options: nosniff"
);

const pageUrl = new URL("/cache/overview/", site).href;
const markdownUrl = new URL("/cache/overview.md", site).href;
const llmsUrl = new URL("/llms.txt", site).href;
const cacheSetUrl = new URL("/_llms-txt/astilba-cache.txt", site).href;
const sitemapUrl = new URL("/sitemap-index.xml", site).href;

const llmsIndex = artifacts.get("llms.txt");
assertIncludes("llms.txt", llmsIndex, cacheSetUrl);
assertIncludes("llms.txt", llmsIndex, "Cache is an unreleased preview");

const cacheSet = artifacts.get("_llms-txt/astilba-cache.txt");
const firstCacheHeading = cacheSet.match(/^# .+$/m)?.[0];

if (firstCacheHeading !== "# Overview") {
  throw new Error(
    `[agent-artifacts] The Cache document set must begin with Overview, found ${JSON.stringify(firstCacheHeading)}.`
  );
}

const html = artifacts.get("cache/overview/index.html");
assertLink(html, "alternate", markdownUrl);
assertLink(html, "describedby", llmsUrl);

const markdown = artifacts.get("cache/overview.md");
assertIncludes("cache/overview.md", markdown, `canonical: ${JSON.stringify(pageUrl)}`);
assertIncludes(
  "cache/overview.md",
  markdown,
  "For React applications, “server-side” means"
);

for (const field of [
  "title",
  "description",
  "product",
  "productId",
  "docsVersion",
  "docsVersionId",
  "lifecycle",
  "source",
]) {
  assertIncludes("cache/overview.md", markdown, `${field}: `);
}

assertIncludes(
  "cache/overview.md",
  markdown,
  'source: "https://github.com/astilbahq/docs/blob/main/src/content/docs/cache/overview.md"'
);

const robots = artifacts.get("robots.txt");
assertIncludes("robots.txt", robots, "User-agent: *\nAllow: /");
assertIncludes("robots.txt", robots, `Sitemap: ${sitemapUrl}`);

const sitemapIndex = artifacts.get("sitemap-index.xml");
assertIncludes(
  "sitemap-index.xml",
  sitemapIndex,
  new URL("/sitemap-0.xml", site).href
);
assertIncludes("sitemap-0.xml", artifacts.get("sitemap-0.xml"), pageUrl);

console.log(
  `[agent-artifacts] Verified ${requiredArtifacts.length} production artifacts for ${site.origin}.`
);

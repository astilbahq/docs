import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020.js";

import {
  API_CATALOG_PATH,
  API_CATALOG_LINK_VALUE,
  createApiCatalog,
  createMcpCatalog,
  createMcpCompatibilityCard,
  createMcpServerCard,
  MCP_CATALOG_PATH,
  MCP_COMPATIBILITY_CARD_PATH,
  MCP_SERVER_CARD_PATH,
} from "../src/docs/agent-discovery.ts";
import { parseDocsCorpus } from "../src/docs/mcp-corpus.ts";
import {
  CONTENT_SECURITY_POLICY_ASSET_PATH,
  GLOBAL_SECURITY_HEADERS,
} from "../src/docs/security.ts";
import { createDocsSitemapLastModified } from "../src/docs/sitemap.ts";
import {
  createContentSecurityPolicy,
  getInlineScriptHashes,
} from "./security-headers.mjs";

const siteValue = process.env.ASTILBA_DOCS_SITE;

if (!siteValue) {
  throw new Error(
    "[agent-artifacts] ASTILBA_DOCS_SITE is required to verify canonical URLs."
  );
}

const site = new URL(siteValue);
const dist = resolve(process.cwd(), "dist");

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(path) : path;
    })
  );

  return files.flat();
};

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

const assertExact = (artifact, label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `[agent-artifacts] dist/${artifact} has unexpected ${label}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}.`
    );
  }
};

const compareStrings = (left, right) =>
  left < right ? -1 : left > right ? 1 : 0;

const parseHeaderRules = (content) =>
  content
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const [pattern, ...lines] = block.split("\n");
      const headers = new Map();

      for (const line of lines) {
        const separator = line.indexOf(":");

        if (!/^\s+/.test(line) || separator === -1) {
          throw new Error(
            `[agent-artifacts] dist/_headers contains a malformed header line: ${JSON.stringify(line)}.`
          );
        }

        const name = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();
        const values = headers.get(name) ?? [];
        values.push(value);
        headers.set(name, values);
      }

      return { headers, pattern };
    });

const assertHeaderValues = (rules, pattern, name, expected) => {
  const matches = rules.filter((rule) => rule.pattern === pattern);

  if (matches.length !== 1) {
    throw new Error(
      `[agent-artifacts] dist/_headers must contain exactly one ${JSON.stringify(pattern)} rule, found ${matches.length}.`
    );
  }

  assertExact(
    "_headers",
    `${pattern} ${name} values`,
    matches[0].headers.get(name.toLowerCase()) ?? [],
    expected
  );
};

const getLinkAttribute = (tag, name) =>
  tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];

const getMarkdownLinks = (html) =>
  (html.match(/<link\b[^>]*>/g) ?? []).filter(
    (tag) =>
      getLinkAttribute(tag, "rel") === "alternate" &&
      getLinkAttribute(tag, "type") === "text/markdown"
  );

const assertLink = (html, rel, href) => {
  const linkTags = html.match(/<link\b[^>]*>/g) ?? [];
  const found = linkTags.some(
    (tag) =>
      getLinkAttribute(tag, "rel") === rel &&
      getLinkAttribute(tag, "href") === href
  );

  if (!found) {
    throw new Error(
      `[agent-artifacts] HTML is missing a rel=${JSON.stringify(rel)} link to ${href}.`
    );
  }
};

const linkHeaderHasRelation = (value, relation) => {
  const relationPattern = /(?:^|;)\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/gi;

  for (const match of value.matchAll(relationPattern)) {
    const relations = (match[1] ?? match[2] ?? "")
      .trim()
      .split(/\s+/)
      .map((item) => item.toLowerCase());

    if (relations.includes(relation.toLowerCase())) {
      return true;
    }
  }

  return false;
};

const getFrontmatterString = (
  markdown,
  field,
  artifact,
  { required = false } = {}
) => {
  const frontmatter = markdown.match(
    /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/
  )?.[1];

  if (!frontmatter) {
    throw new Error(
      `[agent-artifacts] dist/${artifact} must begin with generated frontmatter.`
    );
  }

  const matches = [
    ...frontmatter.matchAll(
      new RegExp(`^${field}:\\s*("(?:[^"\\\\]|\\\\.)*")\\s*$`, "gm")
    ),
  ];

  if (matches.length === 0 && !required) {
    return undefined;
  }

  if (matches.length !== 1) {
    throw new Error(
      `[agent-artifacts] dist/${artifact} must define ${field} ${required ? "exactly once" : "at most once"} as a JSON string.`
    );
  }

  return JSON.parse(matches[0][1]);
};

const requiredArtifacts = [
  ".well-known/api-catalog",
  ".well-known/agent-skills/astilba-cache-docs/SKILL.md",
  ".well-known/agent-skills/index.json",
  ".well-known/mcp/catalog.json",
  ".well-known/mcp/server-card.json",
  "_headers",
  "agent-setup/prompt.md",
  CONTENT_SECURITY_POLICY_ASSET_PATH.slice(1),
  "_llms-txt/astilba-cache.txt",
  "_mcp/docs.json",
  "agents/llms-txt.md",
  "agents/llms-txt/index.html",
  "agents/mcp.md",
  "agents/mcp/index.html",
  "cache.md",
  "cache/index.html",
  "cache/overview.md",
  "cache/overview/index.html",
  "index.md",
  "index.html",
  "llms-full.txt",
  "llms-small.txt",
  "llms.txt",
  "mcp/server-card",
  "pagefind/pagefind.js",
  "robots.txt",
  "sitemap-0.xml",
  "sitemap-index.xml",
  "sitemap.xml",
];

const artifacts = new Map();

for (const artifact of requiredArtifacts) {
  artifacts.set(artifact, await readArtifact(artifact));
}

for (const [path, expected] of [
  [API_CATALOG_PATH, createApiCatalog()],
  [MCP_CATALOG_PATH, createMcpCatalog()],
  [MCP_COMPATIBILITY_CARD_PATH, createMcpCompatibilityCard()],
  [MCP_SERVER_CARD_PATH, createMcpServerCard()],
]) {
  const artifact = path.replace(/^\//, "");
  assertExact(
    artifact,
    "generated discovery document",
    JSON.parse(artifacts.get(artifact)),
    expected
  );
}

const serverCardSchemaSource = await readFile(
  resolve(
    process.cwd(),
    "vendor/modelcontextprotocol/server-card/3b2d974/schema.json"
  ),
  "utf8"
);
const serverCardSchemaDigest = createHash("sha256")
  .update(serverCardSchemaSource)
  .digest("hex");

if (
  serverCardSchemaDigest !==
  "2c772b51edb367f154771d84ddbae87ddba00a624422c8e46f218a9ac03bf042"
) {
  throw new Error(
    "[agent-artifacts] The vendored experimental Server Card schema differs from the reviewed 3b2d974 snapshot."
  );
}

const serverCardSchemaBundle = JSON.parse(serverCardSchemaSource);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateServerCard = ajv.compile({
  $defs: serverCardSchemaBundle.$defs,
  $ref: "#/$defs/ServerCard",
  $schema: serverCardSchemaBundle.$schema,
});
const serverCard = JSON.parse(
  artifacts.get(MCP_SERVER_CARD_PATH.replace(/^\//, ""))
);

if (!validateServerCard(serverCard)) {
  throw new Error(
    `[agent-artifacts] dist${MCP_SERVER_CARD_PATH} does not match the pinned experimental Server Card schema: ${ajv.errorsText(validateServerCard.errors)}.`
  );
}

const contentSignal = "ai-train=yes, search=yes, ai-input=yes";
const staticHeaders = artifacts.get("_headers");
const headerRules = parseHeaderRules(staticHeaders);
const htmlDocuments = await Promise.all(
  (await collectFiles(dist))
    .filter((file) => file.endsWith(".html"))
    .map((file) => readFile(file, "utf8"))
);
const expectedContentSecurityPolicy = createContentSecurityPolicy(
  getInlineScriptHashes(htmlDocuments)
);
const contentSecurityPolicyArtifact =
  CONTENT_SECURITY_POLICY_ASSET_PATH.slice(1);
const markdownHeaderPatterns = headerRules
  .filter((rule) =>
    (rule.headers.get("content-type") ?? []).some((value) =>
      value.toLowerCase().startsWith("text/markdown")
    )
  )
  .map((rule) => rule.pattern)
  .sort();

assertExact(
  "_headers",
  "static Markdown response rule patterns",
  markdownHeaderPatterns,
  []
);

assertHeaderValues(headerRules, "/*", "Content-Signal", [contentSignal]);

for (const [name, value] of Object.entries(GLOBAL_SECURITY_HEADERS)) {
  assertHeaderValues(headerRules, "/*", name, [value]);
}

assertHeaderValues(headerRules, "/*", "Content-Security-Policy", [
  expectedContentSecurityPolicy,
]);
assertExact(
  contentSecurityPolicyArtifact,
  "generated Worker Content-Security-Policy",
  artifacts.get(contentSecurityPolicyArtifact),
  `${expectedContentSecurityPolicy}\n`
);
assertHeaderValues(headerRules, "/_astro/*", "Cache-Control", [
  "public, max-age=31536000, immutable",
]);
assertHeaderValues(
  headerRules,
  "/agent-setup/prompt.md",
  "Access-Control-Allow-Origin",
  ["*"]
);
assertHeaderValues(headerRules, "/agent-setup/prompt.md", "Cache-Control", [
  "public, max-age=3600",
]);
assertHeaderValues(
  headerRules,
  "/agent-setup/prompt.md",
  "X-Content-Type-Options",
  ["nosniff"]
);
assertHeaderValues(headerRules, "/agent-setup/prompt.md", "X-Robots-Tag", [
  "noindex",
]);
assertHeaderValues(
  headerRules,
  "/.well-known/agent-skills/*",
  "Access-Control-Allow-Origin",
  ["*"]
);
assertHeaderValues(
  headerRules,
  "/.well-known/agent-skills/*",
  "Cache-Control",
  ["public, max-age=3600"]
);
assertHeaderValues(
  headerRules,
  "/.well-known/agent-skills/index.json",
  "Content-Type",
  ["application/json; charset=utf-8"]
);
assertHeaderValues(
  headerRules,
  "/.well-known/api-catalog",
  "Access-Control-Allow-Origin",
  ["*"]
);
assertHeaderValues(headerRules, "/.well-known/api-catalog", "Content-Type", [
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
]);
assertHeaderValues(headerRules, "/.well-known/api-catalog", "Link", [
  API_CATALOG_LINK_VALUE,
]);
assertHeaderValues(
  headerRules,
  "/.well-known/mcp/*",
  "Access-Control-Allow-Origin",
  ["*"]
);
assertHeaderValues(headerRules, "/.well-known/mcp/*", "Cache-Control", [
  "public, max-age=3600",
]);
assertHeaderValues(
  headerRules,
  "/.well-known/mcp/catalog.json",
  "Content-Type",
  ["application/json; charset=utf-8"]
);
assertHeaderValues(
  headerRules,
  "/.well-known/mcp/server-card.json",
  "Content-Type",
  ["application/json; charset=utf-8"]
);
assertHeaderValues(
  headerRules,
  "/mcp/server-card",
  "Access-Control-Allow-Origin",
  ["*"]
);
assertHeaderValues(headerRules, "/mcp/server-card", "Content-Type", [
  "application/mcp-server-card+json",
]);
for (const discoveryPattern of [
  "/.well-known/api-catalog",
  "/.well-known/mcp/*",
  "/mcp/server-card",
]) {
  assertHeaderValues(
    headerRules,
    discoveryPattern,
    "Access-Control-Allow-Headers",
    []
  );
  assertHeaderValues(
    headerRules,
    discoveryPattern,
    "Access-Control-Allow-Methods",
    []
  );
  assertHeaderValues(headerRules, discoveryPattern, "Cache-Control", [
    "public, max-age=3600",
  ]);
  assertHeaderValues(headerRules, discoveryPattern, "X-Content-Type-Options", [
    "nosniff",
  ]);
}
assertHeaderValues(headerRules, "/_mcp/docs.json", "Cache-Control", [
  "public, max-age=3600",
]);
assertHeaderValues(headerRules, "/_mcp/docs.json", "Content-Type", [
  "application/json; charset=utf-8",
]);
assertHeaderValues(headerRules, "/_mcp/docs.json", "X-Content-Type-Options", [
  "nosniff",
]);

const contentSignals = headerRules.flatMap(
  (rule) => rule.headers.get("content-signal") ?? []
);
assertExact("_headers", "Content-Signal values", contentSignals, [
  contentSignal,
]);

const skillArtifact = ".well-known/agent-skills/astilba-cache-docs/SKILL.md";
const skill = artifacts.get(skillArtifact);
const skillDigest = `sha256:${createHash("sha256")
  .update(skill)
  .digest("hex")}`;
const skillsIndex = JSON.parse(
  artifacts.get(".well-known/agent-skills/index.json")
);
assertExact(
  ".well-known/agent-skills/index.json",
  "discovery index",
  skillsIndex,
  {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "astilba-cache-docs",
        type: "skill-md",
        description:
          "Consult Astilba's public Cache documentation to explain or evaluate the unreleased TypeScript cache preview without inventing installation or production support.",
        url: `/${skillArtifact}`,
        digest: skillDigest,
      },
    ],
  }
);
assertIncludes(skillArtifact, skill, "# Astilba Cache documentation");
assertIncludes(
  skillArtifact,
  skill,
  "https://docs.astilba.com/cache/api-status.md"
);
assertIncludes(skillArtifact, skill, "https://docs.astilba.com/mcp");

const pageUrl = new URL("/cache/overview/", site).href;
const markdownUrl = new URL("/cache/overview.md", site).href;
const cacheHomeUrl = new URL("/cache/", site).href;
const cacheHomeMarkdownUrl = new URL("/cache.md", site).href;
const homeUrl = new URL("/", site).href;
const homeMarkdownUrl = new URL("/index.md", site).href;
const llmsUrl = new URL("/llms.txt", site).href;
const cacheSetUrl = new URL("/_llms-txt/astilba-cache.txt", site).href;
const mcpUrl = new URL("/mcp", site).href;
const apiCatalogUrl = new URL(API_CATALOG_PATH, site).href;
const mcpCatalogUrl = new URL(MCP_CATALOG_PATH, site).href;
const mcpServerCardUrl = new URL(MCP_SERVER_CARD_PATH, site).href;
const sitemapUrl = new URL("/sitemap.xml", site).href;
const sitemap = artifacts.get("sitemap.xml");
const expectedLastModified = createDocsSitemapLastModified();
const sitemapEntries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
  (match) => {
    const entry = match[1];
    const locations = [...entry.matchAll(/<loc>([^<]+)<\/loc>/g)];
    const lastModified = [...entry.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)];

    if (locations.length !== 1 || lastModified.length !== 1) {
      throw new Error(
        "[agent-artifacts] Every sitemap entry must contain exactly one loc and one lastmod."
      );
    }

    return {
      lastmod: lastModified[0][1],
      page: new URL(locations[0][1]),
    };
  }
);
const sitemapPages = sitemapEntries.map(({ page }) => page);
const sitemapLocations = new Set(sitemapPages.map(({ href }) => href));
const pagePatterns = [];
const mcpResources = [];

if (sitemapLocations.size !== sitemapEntries.length) {
  throw new Error("[agent-artifacts] Sitemap page locations must be unique.");
}

for (const { lastmod, page: sitemapPage } of sitemapEntries) {
  if (sitemapPage.origin !== site.origin) {
    throw new Error(
      `[agent-artifacts] Sitemap page ${sitemapPage.href} is outside ${site.origin}.`
    );
  }

  const expectedPageLastModified = expectedLastModified.get(
    sitemapPage.pathname
  );

  if (lastmod !== expectedPageLastModified) {
    throw new Error(
      `[agent-artifacts] Sitemap page ${sitemapPage.href} has unexpected lastmod ${JSON.stringify(lastmod)}; expected ${JSON.stringify(expectedPageLastModified)}.`
    );
  }

  const pagePattern = sitemapPage.pathname;
  const pageDirectory = decodeURIComponent(pagePattern).replace(
    /^\/+|\/+$/g,
    ""
  );
  const htmlArtifact = pageDirectory
    ? `${pageDirectory}/index.html`
    : "index.html";
  const pageHtml = await readArtifact(htmlArtifact);
  const markdownLinks = getMarkdownLinks(pageHtml);

  if (markdownLinks.length !== 1) {
    throw new Error(
      `[agent-artifacts] dist/${htmlArtifact} must advertise exactly one Markdown alternate, found ${markdownLinks.length}.`
    );
  }

  const alternateHref = getLinkAttribute(markdownLinks[0], "href");

  if (!alternateHref) {
    throw new Error(
      `[agent-artifacts] dist/${htmlArtifact} has a Markdown alternate without an href.`
    );
  }

  const alternateUrl = new URL(alternateHref, site);

  if (
    alternateUrl.origin !== site.origin ||
    alternateUrl.search ||
    alternateUrl.hash
  ) {
    throw new Error(
      `[agent-artifacts] dist/${htmlArtifact} has a non-canonical Markdown alternate: ${alternateHref}.`
    );
  }

  const markdownArtifact = decodeURIComponent(
    alternateUrl.pathname.replace(/^\//, "")
  );
  const markdownContent = await readArtifact(markdownArtifact);
  const canonicalUrl = getFrontmatterString(
    markdownContent,
    "canonical",
    markdownArtifact,
    { required: true }
  );

  if (canonicalUrl !== sitemapPage.href) {
    throw new Error(
      `[agent-artifacts] dist/${markdownArtifact} canonical URL does not match the sitemap: ${JSON.stringify(canonicalUrl)}.`
    );
  }

  assertLink(pageHtml, "describedby", llmsUrl);
  assertLink(pageHtml, "api-catalog", apiCatalogUrl);
  assertLink(pageHtml, "sitemap", sitemapUrl);
  pagePatterns.push(pagePattern);
  mcpResources.push({
    canonicalUrl,
    content: markdownContent,
    description: getFrontmatterString(
      markdownContent,
      "description",
      markdownArtifact,
      { required: true }
    ),
    docsVersion: getFrontmatterString(
      markdownContent,
      "docsVersion",
      markdownArtifact
    ),
    docsVersionId: getFrontmatterString(
      markdownContent,
      "docsVersionId",
      markdownArtifact
    ),
    lifecycle: getFrontmatterString(
      markdownContent,
      "lifecycle",
      markdownArtifact
    ),
    markdownPath: alternateUrl.pathname,
    product: getFrontmatterString(markdownContent, "product", markdownArtifact),
    productId: getFrontmatterString(
      markdownContent,
      "productId",
      markdownArtifact
    ),
    title: getFrontmatterString(markdownContent, "title", markdownArtifact, {
      required: true,
    }),
    uri: alternateUrl.href,
  });
}

if (pagePatterns.length === 0) {
  throw new Error(
    "[agent-artifacts] The sitemap does not contain any documentation pages."
  );
}

if (sitemapEntries.length !== expectedLastModified.size) {
  throw new Error(
    `[agent-artifacts] The sitemap contains ${sitemapEntries.length} pages, but ${expectedLastModified.size} public sources are registered.`
  );
}

const staticMarkdownAlternatePatterns = headerRules
  .filter((rule) =>
    (rule.headers.get("link") ?? []).some((value) =>
      linkHeaderHasRelation(value, "alternate")
    )
  )
  .map((rule) => rule.pattern)
  .sort();
assertExact(
  "_headers",
  "static Markdown alternate Link rule patterns",
  staticMarkdownAlternatePatterns,
  []
);

const mcpCorpus = parseDocsCorpus(JSON.parse(artifacts.get("_mcp/docs.json")));

const sortMcpResources = (left, right) => {
  if (left.markdownPath === "/index.md") {
    return -1;
  }

  if (right.markdownPath === "/index.md") {
    return 1;
  }

  return compareStrings(left.markdownPath, right.markdownPath);
};
const expectedMcpResources = mcpResources.toSorted(sortMcpResources);
assertExact(
  "_mcp/docs.json",
  "public resource corpus",
  mcpCorpus.pages,
  expectedMcpResources
);

const llmsIndex = artifacts.get("llms.txt");
assertIncludes("llms.txt", llmsIndex, cacheSetUrl);
assertIncludes("llms.txt", llmsIndex, "Cache is an unreleased preview");
assertIncludes("llms.txt", llmsIndex, mcpUrl);
assertIncludes("llms-full.txt", artifacts.get("llms-full.txt"), "# MCP Server");
assertIncludes("llms-full.txt", artifacts.get("llms-full.txt"), mcpUrl);

const cacheSet = artifacts.get("_llms-txt/astilba-cache.txt");
const firstCacheHeading = cacheSet.match(/^# .+$/m)?.[0];

if (firstCacheHeading !== "# Cache") {
  throw new Error(
    `[agent-artifacts] The Cache document set must begin with Cache, found ${JSON.stringify(firstCacheHeading)}.`
  );
}

const html = artifacts.get("cache/overview/index.html");
assertLink(html, "alternate", markdownUrl);
assertLink(html, "describedby", llmsUrl);

const homeHtml = artifacts.get("index.html");
assertLink(homeHtml, "alternate", homeMarkdownUrl);
assertLink(homeHtml, "describedby", llmsUrl);
assertLink(homeHtml, "api-catalog", apiCatalogUrl);

const cacheHomeHtml = artifacts.get("cache/index.html");
assertLink(cacheHomeHtml, "alternate", cacheHomeMarkdownUrl);
assertLink(cacheHomeHtml, "describedby", llmsUrl);

const mcpUsageHtml = artifacts.get("agents/mcp/index.html");
assertLink(mcpUsageHtml, "alternate", new URL("/agents/mcp.md", site).href);
assertLink(mcpUsageHtml, "api-catalog", apiCatalogUrl);
const mcpUsageMarkdown = artifacts.get("agents/mcp.md");
assertIncludes("agents/mcp.md", mcpUsageMarkdown, "# MCP Server");
assertIncludes("agents/mcp.md", mcpUsageMarkdown, mcpUrl);
assertIncludes("agents/mcp.md", mcpUsageMarkdown, mcpCatalogUrl);
assertIncludes("agents/mcp.md", mcpUsageMarkdown, mcpServerCardUrl);

const llmsUsageHtml = artifacts.get("agents/llms-txt/index.html");
assertLink(
  llmsUsageHtml,
  "alternate",
  new URL("/agents/llms-txt.md", site).href
);
const llmsUsageMarkdown = artifacts.get("agents/llms-txt.md");
assertIncludes("agents/llms-txt.md", llmsUsageMarkdown, "# LLMs.txt");
assertIncludes("agents/llms-txt.md", llmsUsageMarkdown, llmsUrl);
assertIncludes("agents/llms-txt.md", llmsUsageMarkdown, mcpUrl);
assertIncludes(
  "agents/llms-txt.md",
  llmsUsageMarkdown,
  new URL("/cache/overview.md", site).href
);
assertIncludes(
  "agents/llms-txt.md",
  llmsUsageMarkdown,
  "Fetch https://docs.astilba.com/agent-setup/prompt.md and follow its instructions."
);

assertIncludes("agents/mcp.md", mcpUsageMarkdown, "## Try it");
assertIncludes("agents/mcp.md", mcpUsageMarkdown, "## Troubleshooting");
assertIncludes(
  "agents/mcp.md",
  mcpUsageMarkdown,
  "Fetch https://docs.astilba.com/agent-setup/prompt.md and follow its instructions."
);

const homeMarkdown = artifacts.get("index.md");
assertIncludes(
  "index.md",
  homeMarkdown,
  `canonical: ${JSON.stringify(homeUrl)}`
);
assertIncludes("index.md", homeMarkdown, "# Overview");

const cacheHomeMarkdown = artifacts.get("cache.md");
assertIncludes(
  "cache.md",
  cacheHomeMarkdown,
  `canonical: ${JSON.stringify(cacheHomeUrl)}`
);
assertIncludes("cache.md", cacheHomeMarkdown, "# Cache");
assertIncludes("cache.md", cacheHomeMarkdown, "/cache/overview/");

const agentSetupPrompt = artifacts.get("agent-setup/prompt.md");
assertIncludes(
  "agent-setup/prompt.md",
  agentSetupPrompt,
  "# Set up Astilba documentation"
);
assertIncludes("agent-setup/prompt.md", agentSetupPrompt, mcpUrl);
assertIncludes(
  "agent-setup/prompt.md",
  agentSetupPrompt,
  "astilba-cache-docs/SKILL.md"
);
assertIncludes(
  "agent-setup/prompt.md",
  agentSetupPrompt,
  "unreleased source preview"
);

const markdown = artifacts.get("cache/overview.md");
assertIncludes(
  "cache/overview.md",
  markdown,
  `canonical: ${JSON.stringify(pageUrl)}`
);
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
assertExact("robots.txt", "directives", robots.trimEnd().split("\n"), [
  "User-agent: *",
  `Content-Signal: ${contentSignal}`,
  "Allow: /",
  "",
  `Sitemap: ${sitemapUrl}`,
]);

const sitemapIndex = artifacts.get("sitemap-index.xml");
assertIncludes(
  "sitemap-index.xml",
  sitemapIndex,
  new URL("/sitemap-0.xml", site).href
);
assertExact(
  "sitemap.xml",
  "single-file sitemap content",
  sitemap,
  artifacts.get("sitemap-0.xml")
);
assertIncludes("sitemap.xml", sitemap, pageUrl);

console.log(
  `[agent-artifacts] Verified ${requiredArtifacts.length} production artifacts for ${site.origin}.`
);

import { createHash } from "node:crypto";
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
  ".well-known/agent-skills/astilba-cache-docs/SKILL.md",
  ".well-known/agent-skills/index.json",
  "_headers",
  "_llms-txt/astilba-cache.txt",
  "_mcp/docs.json",
  "cache/overview.md",
  "cache/overview/index.html",
  "index.md",
  "index.html",
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

const contentSignal = "ai-train=no, search=yes, ai-input=yes";
const staticHeaders = artifacts.get("_headers");
const headerRules = parseHeaderRules(staticHeaders);
assertHeaderValues(headerRules, "/*", "Content-Signal", [contentSignal]);
assertHeaderValues(headerRules, "/", "Link", [
  '</index.md>; rel="alternate"; type="text/markdown"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
]);
assertHeaderValues(headerRules, "/*.md", "Content-Type", [
  "text/markdown; charset=utf-8",
]);
assertHeaderValues(headerRules, "/*.md", "X-Content-Type-Options", [
  "nosniff",
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
assertHeaderValues(headerRules, "/_mcp/docs.json", "Cache-Control", [
  "public, max-age=3600",
]);
assertHeaderValues(headerRules, "/_mcp/docs.json", "Content-Type", [
  "application/json; charset=utf-8",
]);
assertHeaderValues(
  headerRules,
  "/_mcp/docs.json",
  "X-Content-Type-Options",
  ["nosniff"]
);

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
assertIncludes(skillArtifact, skill, "https://docs.astilba.com/cache/api-status.md");
assertIncludes(skillArtifact, skill, "https://docs.astilba.com/mcp");

const pageUrl = new URL("/cache/overview/", site).href;
const markdownUrl = new URL("/cache/overview.md", site).href;
const homeUrl = new URL("/", site).href;
const homeMarkdownUrl = new URL("/index.md", site).href;
const llmsUrl = new URL("/llms.txt", site).href;
const cacheSetUrl = new URL("/_llms-txt/astilba-cache.txt", site).href;
const mcpUrl = new URL("/mcp", site).href;
const sitemapUrl = new URL("/sitemap-index.xml", site).href;

const sitemapPages = [
  ...artifacts.get("sitemap-0.xml").matchAll(/<loc>([^<]+)<\/loc>/g),
].map((match) => new URL(match[1]));
const pagePatterns = [];
const mcpResources = [];

for (const sitemapPage of sitemapPages) {
  if (sitemapPage.origin !== site.origin) {
    throw new Error(
      `[agent-artifacts] Sitemap page ${sitemapPage.href} is outside ${site.origin}.`
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
  assertHeaderValues(headerRules, pagePattern, "Link", [
    `<${alternateUrl.pathname}>; rel="alternate"; type="text/markdown"`,
    '</llms.txt>; rel="describedby"; type="text/plain"',
  ]);
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
    product: getFrontmatterString(
      markdownContent,
      "product",
      markdownArtifact
    ),
    productId: getFrontmatterString(
      markdownContent,
      "productId",
      markdownArtifact
    ),
    title: getFrontmatterString(
      markdownContent,
      "title",
      markdownArtifact,
      { required: true }
    ),
    uri: alternateUrl.href,
  });
}

if (pagePatterns.length === 0) {
  throw new Error(
    "[agent-artifacts] The sitemap does not contain any documentation pages."
  );
}

const advertisedPagePatterns = headerRules
  .filter((rule) =>
    (rule.headers.get("link") ?? []).some((value) =>
      value.includes('rel="alternate"')
    )
  )
  .map((rule) => rule.pattern)
  .sort();
assertExact(
  "_headers",
  "Markdown alternate rule patterns",
  advertisedPagePatterns,
  pagePatterns.sort()
);

const mcpCorpus = JSON.parse(artifacts.get("_mcp/docs.json"));
assertExact(
  "_mcp/docs.json",
  "schema version",
  mcpCorpus.schemaVersion,
  1
);

if (!Array.isArray(mcpCorpus.pages)) {
  throw new Error(
    "[agent-artifacts] dist/_mcp/docs.json must contain a pages array."
  );
}

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

const homeHtml = artifacts.get("index.html");
assertLink(homeHtml, "alternate", homeMarkdownUrl);
assertLink(homeHtml, "describedby", llmsUrl);

const homeMarkdown = artifacts.get("index.md");
assertIncludes("index.md", homeMarkdown, `canonical: ${JSON.stringify(homeUrl)}`);
assertIncludes("index.md", homeMarkdown, "# Astilba documentation");

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
assertExact(
  "robots.txt",
  "directives",
  robots.trimEnd().split("\n"),
  [
    "User-agent: *",
    `Content-Signal: ${contentSignal}`,
    "Allow: /",
    "",
    `Sitemap: ${sitemapUrl}`,
  ]
);

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

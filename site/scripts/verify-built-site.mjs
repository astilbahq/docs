import { readFile, readdir, stat } from "node:fs/promises";

const distDirectory = new URL("../dist/", import.meta.url);
const requiredFiles = [
  ".well-known/agent-skills/index.json",
  ".well-known/api-catalog",
  ".well-known/mcp/catalog.json",
  ".well-known/mcp/server-card.json",
  "404.html",
  "_headers",
  "cache/index.html",
  "create/index.html",
  "index.html",
  "llms.txt",
  "mcp/server-card",
  "robots.txt",
  "schemas/create/v1.json",
  "site.js",
  "sitemap-site.xml",
  "sitemap.xml",
];

const readArtifact = (path) => readFile(new URL(path, distDirectory), "utf8");

const assertIncludes = (source, expected, label) => {
  if (!source.includes(expected)) {
    throw new Error(`${label} must include ${expected}`);
  }
};

const getAbsoluteAttributeUrls = (source) =>
  [...source.matchAll(/\b(?:action|href|src)="([^"]+)"/gu)]
    .map(([, value]) => value)
    .filter((value) => /^https?:\/\//u.test(value))
    .map((value) => new URL(value));

for (const path of requiredFiles) {
  const artifact = new URL(path, distDirectory);
  if (!(await stat(artifact)).isFile()) {
    throw new Error(`Missing built site artifact: ${path}`);
  }
}

const [
  home,
  cache,
  create,
  schema,
  headers,
  robots,
  sitemap,
  skills,
  apiCatalog,
] = await Promise.all([
  readArtifact("index.html"),
  readArtifact("cache/index.html"),
  readArtifact("create/index.html"),
  readArtifact("schemas/create/v1.json"),
  readArtifact("_headers"),
  readArtifact("robots.txt"),
  readArtifact("sitemap.xml"),
  readArtifact(".well-known/agent-skills/index.json"),
  readArtifact(".well-known/api-catalog"),
]);

assertIncludes(home, 'href="https://astilba.com/" rel="canonical"', "Homepage");
assertIncludes(
  cache,
  'href="https://astilba.com/cache/" rel="canonical"',
  "Cache page"
);
assertIncludes(home, "create-astilba", "Homepage");
assertIncludes(home, "Cache remains a development preview", "Homepage");
assertIncludes(cache, "No npm package", "Cache page");
assertIncludes(
  create,
  'href="https://astilba.com/create/" rel="canonical"',
  "Create page"
);
assertIncludes(create, "four recipe v1 contracts", "Create page");
assertIncludes(create, "github.com/astilbahq/create", "Create page");
assertIncludes(headers, "Content-Security-Policy:", "Static headers");
assertIncludes(
  robots,
  "Sitemap: https://astilba.com/sitemap.xml",
  "Robots file"
);
assertIncludes(
  sitemap,
  "https://astilba.com/docs/sitemap.xml",
  "Sitemap index"
);
assertIncludes(
  skills,
  '"url": "/docs/.well-known/agent-skills/astilba-create-docs/SKILL.md"',
  "Agent Skills discovery"
);
assertIncludes(
  skills,
  '"url": "/docs/.well-known/agent-skills/astilba-cache-docs/SKILL.md"',
  "Agent Skills discovery"
);
assertIncludes(
  apiCatalog,
  '"anchor": "https://astilba.com/docs/mcp"',
  "API catalog"
);

const createSchema = JSON.parse(schema);
if (
  createSchema.$id !== "https://astilba.com/schemas/create/v1.json" ||
  createSchema.properties?.schemaVersion?.const !== 1
) {
  throw new Error("Create schema must publish the v1 manifest contract.");
}

for (const [label, source] of [
  ["Homepage", home],
  ["Cache page", cache],
  ["Create page", create],
]) {
  if (
    getAbsoluteAttributeUrls(source).some(
      ({ hostname }) => hostname === "docs.astilba.com"
    )
  ) {
    throw new Error(
      `${label} must not reference the legacy documentation origin.`
    );
  }

  if (/<style(?:\s|>)/u.test(source)) {
    throw new Error(`${label} must keep executable styles in external assets.`);
  }

  if (/<script(?![^>]*\ssrc=)[^>]*>/u.test(source)) {
    throw new Error(`${label} must keep scripts in external assets.`);
  }
}

const assetDirectory = new URL("_astro/", distDirectory);
const assetFiles = await readdir(assetDirectory);
if (!assetFiles.some((file) => file.endsWith(".css"))) {
  throw new Error("The built site must contain an external stylesheet.");
}

const assetStats = await Promise.all(
  assetFiles.map(async (file) => ({
    file,
    size: (await stat(new URL(file, assetDirectory))).size,
  }))
);
if (assetStats.some(({ size }) => size === 0)) {
  throw new Error("Built site assets must not be empty.");
}

import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { API_CATALOG_LINK_VALUE } from "../src/docs/agent-discovery.ts";

const dist = resolve(process.cwd(), "dist");
const headersPath = resolve(dist, "_headers");
const maxHeaderRules = 100;
const siteValue = process.env.ASTILBA_DOCS_SITE;

if (!siteValue) {
  throw new Error(
    "[agent-headers] ASTILBA_DOCS_SITE is required to generate canonical response links."
  );
}

const site = new URL(siteValue);

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

const fileExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};

const staticHeaders = (await readFile(headersPath, "utf8")).trimEnd();
const files = await collectFiles(dist);
const markdownPages = [];

for (const file of files) {
  if (!file.endsWith("index.html")) {
    continue;
  }

  const html = await readFile(file, "utf8");
  const markdownLinks = (html.match(/<link\b[^>]*>/g) ?? []).filter(
    (tag) =>
      tag.includes('rel="alternate"') &&
      tag.includes('type="text/markdown"')
  );

  if (markdownLinks.length === 0) {
    continue;
  }

  if (markdownLinks.length !== 1) {
    throw new Error(
      `[agent-headers] ${relative(dist, file)} must advertise exactly one Markdown alternate, found ${markdownLinks.length}.`
    );
  }

  const href = markdownLinks[0].match(/\bhref="([^"]+)"/)?.[1];

  if (!href) {
    throw new Error(
      `[agent-headers] ${relative(dist, file)} has a Markdown alternate without an href.`
    );
  }

  const markdownUrl = new URL(href, site);

  if (
    markdownUrl.origin !== site.origin ||
    markdownUrl.search ||
    markdownUrl.hash
  ) {
    throw new Error(
      `[agent-headers] ${relative(dist, file)} has a non-canonical Markdown alternate: ${href}.`
    );
  }

  const markdownPath = decodeURIComponent(markdownUrl.pathname.slice(1));

  if (
    !markdownPath.endsWith(".md") ||
    !(await fileExists(resolve(dist, markdownPath)))
  ) {
    throw new Error(
      `[agent-headers] ${relative(dist, file)} points to missing dist/${markdownPath}.`
    );
  }

  const htmlPath = relative(dist, file).split(sep).join("/");
  const pagePath =
    htmlPath === "index.html"
      ? ""
      : htmlPath.slice(0, -"/index.html".length);

  markdownPages.push({ markdownPath, pagePath });
}

markdownPages.sort((left, right) => left.pagePath.localeCompare(right.pagePath));

if (markdownPages.length === 0) {
  throw new Error(
    "[agent-headers] No HTML pages with Markdown alternates were found."
  );
}

const staticRuleCount = staticHeaders.split(/\n\s*\n/).length;
const totalRuleCount = staticRuleCount + markdownPages.length;

if (totalRuleCount > maxHeaderRules) {
  throw new Error(
    `[agent-headers] ${totalRuleCount} header rules exceed Cloudflare's ${maxHeaderRules}-rule limit. Consolidate the generated page rules before adding more documentation pages.`
  );
}

const pageHeaders = markdownPages
  .map(
    ({ markdownPath, pagePath }) =>
      `/${pagePath ? `${pagePath}/` : ""}\n  Link: </${markdownPath}>; rel="alternate"; type="text/markdown"\n  Link: </llms.txt>; rel="describedby"; type="text/plain"\n  Link: ${API_CATALOG_LINK_VALUE}`
  )
  .join("\n\n");

await writeFile(headersPath, `${staticHeaders}\n\n${pageHeaders}\n`, "utf8");

console.log(
  `[agent-headers] Advertised ${markdownPages.length} Markdown alternates.`
);

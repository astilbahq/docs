import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = site ? new URL("/sitemap.xml", site) : undefined;
  const body = [
    "User-agent: *",
    "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
    "Allow: /",
    sitemapUrl ? "" : undefined,
    sitemapUrl ? `Sitemap: ${sitemapUrl.href}` : undefined,
    "",
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

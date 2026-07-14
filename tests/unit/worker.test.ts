import { describe, expect, it, vi } from "vitest";
import {
  acceptsMarkdown,
  getMarkdownPath,
  handleRequest,
} from "../../worker/index";

const createAssets = () => {
  const fetch = vi.fn<Fetcher["fetch"]>(async (input, init) => {
    const request = new Request(input, init);
    const path = new URL(request.url).pathname;

    if (path === "/index.md" || path === "/cache/overview.md") {
      if (request.headers.get("If-None-Match") === '"markdown"') {
        return new Response(null, {
          headers: { ETag: '"markdown"' },
          status: 304,
        });
      }

      return new Response(`# ${path === "/index.md" ? "Home" : "Overview"}`, {
        headers: {
          "Content-Signal": "ai-train=no, search=yes, ai-input=yes",
          "Content-Type": "text/markdown; charset=utf-8",
          ETag: '"markdown"',
        },
      });
    }

    if (path === "/missing.md" || path === "/missing/") {
      return new Response("Not found", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 404,
      });
    }

    return new Response("<h1>Overview</h1>", {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        Vary: "Accept-Encoding",
      },
    });
  });
  const assets = {
    connect() {
      throw new Error("The test asset binding does not open sockets.");
    },
    fetch,
  } satisfies Fetcher;

  return { assets, fetch };
};

describe("Markdown negotiation", () => {
  it("requires an explicit positive text/markdown media range", () => {
    expect(acceptsMarkdown(null)).toBe(false);
    expect(acceptsMarkdown("*/*")).toBe(false);
    expect(acceptsMarkdown("text/html, text/markdown;q=0")).toBe(false);
    expect(
      acceptsMarkdown("text/html;q=0.5, TEXT/MARKDOWN; q=0.8")
    ).toBe(true);
    expect(acceptsMarkdown("text/markdown;q=0.8invalid")).toBe(false);
    expect(acceptsMarkdown("text/markdown;q=0x1")).toBe(false);
    expect(acceptsMarkdown("text/markdown;q=.8")).toBe(false);
    expect(acceptsMarkdown("text/markdown;q=1.0000")).toBe(false);
  });

  it("honours quality and specificity when HTML is also acceptable", () => {
    expect(
      acceptsMarkdown("text/html;q=1, text/markdown;q=0.1")
    ).toBe(false);
    expect(
      acceptsMarkdown("text/html;q=0.1, text/markdown;q=0.8")
    ).toBe(true);
    expect(
      acceptsMarkdown("application/json;q=1, text/markdown;q=0.8")
    ).toBe(true);
    expect(acceptsMarkdown("text/html, text/markdown")).toBe(true);
    expect(acceptsMarkdown("*/*;q=1, text/markdown;q=0.8")).toBe(
      false
    );
    expect(
      acceptsMarkdown("text/*;q=0.9, text/markdown;q=0.8")
    ).toBe(false);
    expect(
      acceptsMarkdown(
        "text/*;q=0.9, text/html;q=0.1, text/markdown;q=0.8"
      )
    ).toBe(true);
    expect(acceptsMarkdown("text/*;q=1, text/markdown;q=0")).toBe(
      false
    );
  });

  it("matches media parameters before applying their quality", () => {
    expect(
      acceptsMarkdown(
        "text/markdown;q=1, text/markdown;charset=utf-8;q=0, text/html;q=0.5"
      )
    ).toBe(false);
    expect(
      acceptsMarkdown(
        "text/markdown;charset=iso-8859-1;q=1, text/html;q=0.5"
      )
    ).toBe(false);
    expect(
      acceptsMarkdown(
        'text/html;q=0.5, text/markdown;charset="UTF-8";q=0.8'
      )
    ).toBe(true);
    expect(
      acceptsMarkdown(
        'text/markdown;profile="x,y";q=0, text/html;q=1'
      )
    ).toBe(false);
    expect(
      acceptsMarkdown(
        "text/html;q=0.5, text/markdown;q=0.8;charset=utf-8"
      )
    ).toBe(true);
    expect(
      acceptsMarkdown(
        "text/html;q=0.5, text/markdown;q=0.8;charset=iso-8859-1"
      )
    ).toBe(false);
    expect(acceptsMarkdown("text/markdown;q=0.8;broken")).toBe(
      false
    );
  });

  it("maps canonical pages to their authored Markdown siblings", () => {
    expect(getMarkdownPath("/")).toBe("/index.md");
    expect(getMarkdownPath("/cache/overview/")).toBe(
      "/cache/overview.md"
    );
    expect(getMarkdownPath("/cache/overview")).toBeUndefined();
    expect(getMarkdownPath("/missing/")).toBeUndefined();
  });

  it("streams the Markdown asset at the canonical URL", async () => {
    const { assets, fetch } = createAssets();
    const response = await handleRequest(
      new Request("https://docs.astilba.com/cache/overview/", {
        headers: { Accept: "text/markdown" },
      }),
      assets
    );

    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8"
    );
    expect(response.headers.get("Content-Location")).toBe(
      "/cache/overview.md"
    );
    expect(response.headers.get("Link")).toBe(
      '</cache/overview.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain"'
    );
    expect(response.headers.get("Vary")).toBe("Accept");
    expect(response.headers.get("ETag")).toBe('"markdown"');
    expect(await response.text()).toBe("# Overview");
    const assetInput = fetch.mock.calls[0]?.[0];
    const assetUrl =
      assetInput instanceof Request ? assetInput.url : assetInput?.toString();
    expect(new URL(assetUrl ?? "").pathname).toBe("/cache/overview.md");
  });

  it("preserves Markdown revalidation responses", async () => {
    const { assets, fetch } = createAssets();
    const response = await handleRequest(
      new Request("https://docs.astilba.com/cache/overview/", {
        headers: {
          Accept: "text/markdown",
          "If-None-Match": '"markdown"',
        },
      }),
      assets
    );

    expect(response.status).toBe(304);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8"
    );
    expect(response.headers.get("Content-Location")).toBe(
      "/cache/overview.md"
    );
    expect(response.headers.get("Vary")).toBe("Accept");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("serves HTML for normal requests and merges Vary", async () => {
    const { assets } = createAssets();
    const response = await handleRequest(
      new Request("https://docs.astilba.com/cache/overview/"),
      assets
    );

    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8"
    );
    expect(response.headers.get("Vary")).toBe("Accept-Encoding, Accept");
  });

  it("falls back to the real HTML 404 when no Markdown sibling exists", async () => {
    const { assets, fetch } = createAssets();
    const response = await handleRequest(
      new Request("https://docs.astilba.com/missing/", {
        headers: { Accept: "text/markdown" },
      }),
      assets
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8"
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

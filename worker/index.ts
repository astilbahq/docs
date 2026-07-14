import { docsProducts } from "../src/docs/catalog";

const MARKDOWN_MEDIA_TYPE = "text/markdown";
const MARKDOWN_PATHS = new Set([
  "/index.md",
  ...docsProducts.flatMap((product) =>
    product.versions.flatMap((version) =>
      version.sections.flatMap((section) =>
        section.items.map(
          (page) => `/${version.basePath}/${page.slug}.md`
        )
      )
    )
  ),
]);

const addVaryAccept = (response: Response): Response => {
  const headers = new Headers(response.headers);
  const vary = headers.get("Vary");
  const variesOnAccept = vary
    ?.split(",")
    .some((value) => value.trim().toLowerCase() === "accept");

  if (!variesOnAccept) {
    headers.set("Vary", vary ? `${vary}, Accept` : "Accept");
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

const getQuality = (parameters: string[]): number => {
  const qualityParameter = parameters.find(
    (parameter) => parameter.split("=", 1)[0]?.trim().toLowerCase() === "q"
  );

  if (!qualityParameter) {
    return 1;
  }

  const quality = Number.parseFloat(
    qualityParameter.slice(qualityParameter.indexOf("=") + 1).trim()
  );

  return Number.isFinite(quality) && quality >= 0 && quality <= 1
    ? quality
    : 0;
};

export const acceptsMarkdown = (accept: string | null): boolean => {
  if (!accept) {
    return false;
  }

  return accept.split(",").some((range) => {
    const [mediaType, ...parameters] = range.split(";");

    return (
      mediaType?.trim().toLowerCase() === MARKDOWN_MEDIA_TYPE &&
      getQuality(parameters) > 0
    );
  });
};

export const getMarkdownPath = (pathname: string): string | undefined => {
  const markdownPath =
    pathname === "/"
      ? "/index.md"
      : `${pathname.replace(/\/$/, "")}.md`;

  if (!pathname.endsWith("/") || !MARKDOWN_PATHS.has(markdownPath)) {
    return undefined;
  }

  return markdownPath;
};

const getAsset = (
  assets: Fetcher,
  request: Request,
  pathname?: string
): Promise<Response> => {
  if (!pathname) {
    return assets.fetch(request);
  }

  const url = new URL(request.url);
  url.pathname = pathname;

  return assets.fetch(
    new Request(url, {
      headers: request.headers,
      method: request.method,
      redirect: request.redirect,
    })
  );
};

export const handleRequest = async (
  request: Request,
  assets: Fetcher
): Promise<Response> => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return assets.fetch(request);
  }

  const url = new URL(request.url);
  const markdownPath = getMarkdownPath(url.pathname);

  if (markdownPath && acceptsMarkdown(request.headers.get("Accept"))) {
    const markdownResponse = await getAsset(assets, request, markdownPath);
    const contentType = markdownResponse.headers.get("Content-Type");

    const isNotModified = markdownResponse.status === 304;
    const isMarkdown =
      markdownResponse.ok &&
      contentType?.toLowerCase().startsWith(MARKDOWN_MEDIA_TYPE);

    if (isNotModified || isMarkdown) {
      const headers = new Headers(markdownResponse.headers);
      headers.set(
        "Content-Type",
        contentType ?? `${MARKDOWN_MEDIA_TYPE}; charset=utf-8`
      );
      headers.set("Content-Location", markdownPath);
      headers.set(
        "Link",
        `<${markdownPath}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain"`
      );

      return addVaryAccept(
        new Response(markdownResponse.body, {
          headers,
          status: markdownResponse.status,
          statusText: markdownResponse.statusText,
        })
      );
    }

    await markdownResponse.body?.cancel();
  }

  return addVaryAccept(await getAsset(assets, request));
};

export default {
  fetch(request, env) {
    return handleRequest(request, env.ASSETS);
  },
} satisfies ExportedHandler<Env>;

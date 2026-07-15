const CANONICAL_ORIGIN = "https://docs.astilba.com";
const HTML_PATH = "/cache/overview/";
const MARKDOWN_PATH = "/cache/overview.md";
const MCP_PATH = "/mcp";
const MCP_PROTOCOL_VERSION = "2025-11-25";
const USER_AGENT = "astilba-docs-production-smoke/1.0";

const readInteger = (name, fallback, maximum) => {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(
      `[production-smoke] ${name} must be an integer from 1 to ${maximum}.`
    );
  }

  return value;
};

const attempts = readInteger("ASTILBA_DOCS_SMOKE_ATTEMPTS", 6, 10);
const requestTimeoutMs = readInteger(
  "ASTILBA_DOCS_SMOKE_REQUEST_TIMEOUT_MS",
  10_000,
  30_000
);
const retryDelayMs = readInteger(
  "ASTILBA_DOCS_SMOKE_RETRY_DELAY_MS",
  2_000,
  30_000
);
const site = new URL(
  process.env.ASTILBA_DOCS_SMOKE_ORIGIN ?? CANONICAL_ORIGIN
);

const isLoopback = new Set(["127.0.0.1", "[::1]", "localhost"]).has(
  site.hostname
);

if (
  site.username ||
  site.password ||
  site.pathname !== "/" ||
  site.search ||
  site.hash ||
  (site.protocol !== "https:" && !(site.protocol === "http:" && isLoopback))
) {
  throw new Error(
    "[production-smoke] ASTILBA_DOCS_SMOKE_ORIGIN must be an HTTPS origin, or an HTTP loopback origin for local verification."
  );
}

const sleep = (durationMs) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

const request = async (path, init = {}) => {
  const response = await fetch(new URL(path, site), {
    ...init,
    headers: {
      "User-Agent": USER_AGENT,
      ...init.headers,
    },
    redirect: "error",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  return response;
};

const requireStatus = (response, label) => {
  if (response.status !== 200) {
    throw new Error(
      `[production-smoke] ${label} returned HTTP ${response.status}.`
    );
  }
};

const requireHeaderIncludes = (response, name, expected, label) => {
  const actual = response.headers.get(name)?.toLowerCase() ?? "";

  if (!actual.includes(expected.toLowerCase())) {
    throw new Error(
      `[production-smoke] ${label} returned unexpected ${name}: ${JSON.stringify(actual)}.`
    );
  }
};

const requireHeaderEquals = (response, name, expected, label) => {
  const actual = response.headers.get(name);

  if (actual !== expected) {
    throw new Error(
      `[production-smoke] ${label} returned unexpected ${name}: ${JSON.stringify(actual)}.`
    );
  }
};

const requireHeaderAbsent = (response, name, label) => {
  const actual = response.headers.get(name);

  if (actual !== null) {
    throw new Error(
      `[production-smoke] ${label} unexpectedly returned ${name}: ${JSON.stringify(actual)}.`
    );
  }
};

const requireHsts = (response, label) =>
  requireHeaderEquals(
    response,
    "Strict-Transport-Security",
    "max-age=31536000",
    label
  );

const parseContentSecurityPolicy = (value) => {
  const directives = new Map();

  for (const rawDirective of value.split(";")) {
    const parts = rawDirective.trim().split(/\s+/);
    const name = parts.shift()?.toLowerCase();

    if (!name) {
      continue;
    }

    if (directives.has(name)) {
      throw new Error(
        `[production-smoke] Content-Security-Policy repeats ${name}.`
      );
    }

    directives.set(name, parts);
  }

  return directives;
};

const requireContentSecurityPolicy = (response, label) => {
  const rawPolicy = response.headers.get("Content-Security-Policy");

  if (!rawPolicy) {
    throw new Error(
      `[production-smoke] ${label} is missing Content-Security-Policy.`
    );
  }

  const directives = parseContentSecurityPolicy(rawPolicy);
  const expectedDirectives = new Map([
    ["default-src", ["'none'"]],
    ["base-uri", ["'none'"]],
    ["connect-src", ["'self'"]],
    ["font-src", ["'self'", "data:"]],
    ["form-action", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["frame-src", ["'none'"]],
    ["img-src", ["'self'", "data:"]],
    ["manifest-src", ["'none'"]],
    ["media-src", ["'none'"]],
    ["object-src", ["'none'"]],
    ["script-src-attr", ["'none'"]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["worker-src", ["'self'"]],
  ]);
  const knownDirectives = new Set([
    ...expectedDirectives.keys(),
    "script-src",
  ]);

  for (const name of directives.keys()) {
    if (!knownDirectives.has(name)) {
      throw new Error(
        `[production-smoke] ${label} returned an unexpected CSP directive: ${JSON.stringify(name)}.`
      );
    }
  }

  for (const [name, expectedSources] of expectedDirectives) {
    const actualSources = directives.get(name);

    if (
      !actualSources ||
      actualSources.length !== expectedSources.length ||
      !expectedSources.every((source) => actualSources.includes(source))
    ) {
      throw new Error(
        `[production-smoke] ${label} returned unexpected ${name}: ${JSON.stringify(actualSources)}.`
      );
    }
  }

  const scriptSources = directives.get("script-src") ?? [];
  const scriptHashes = scriptSources.filter((source) =>
    /^'sha256-[A-Za-z0-9+/]{43}='$/.test(source)
  );

  if (
    !scriptSources.includes("'self'") ||
    !scriptSources.includes("'wasm-unsafe-eval'") ||
    scriptSources.includes("'unsafe-inline'") ||
    scriptSources.includes("'unsafe-eval'") ||
    scriptHashes.length === 0 ||
    scriptSources.length !== scriptHashes.length + 2
  ) {
    throw new Error(
      `[production-smoke] ${label} returned an unsafe or incomplete script-src.`
    );
  }
};

const getFingerprintAsset = (html) => {
  const assetPattern = /(?:src|href)="([^"]*\/_astro\/[^"?#]+(?:\?[^"#]*)?)"/g;

  for (const match of html.matchAll(assetPattern)) {
    const value = match[1]?.replaceAll("&amp;", "&");

    if (!value) {
      continue;
    }

    const asset = new URL(value, site);
    const isFingerprint =
      /\.[A-Za-z0-9_-]{6,}\.(?:css|js|mjs|svg|woff2?)(?:$|[?#])/.test(
        asset.href
      );

    if (asset.origin === site.origin && isFingerprint) {
      return asset;
    }
  }

  throw new Error(
    "[production-smoke] HTML did not reference a same-origin fingerprinted asset."
  );
};

const checkHtml = async () => {
  const response = await request(HTML_PATH, {
    headers: { Accept: "text/html" },
  });
  requireStatus(response, "HTML page");
  requireHeaderIncludes(response, "Content-Type", "text/html", "HTML page");
  requireHeaderIncludes(
    response,
    "Link",
    '</cache/overview.md>; rel="alternate"',
    "HTML page"
  );
  requireHsts(response, "HTML page");
  requireContentSecurityPolicy(response, "HTML page");
  const html = await response.text();

  if (!(html.includes("<html") && html.includes("Astilba"))) {
    throw new Error("[production-smoke] HTML page content is incomplete.");
  }

  return getFingerprintAsset(html);
};

const checkMarkdown = async () => {
  const response = await request(HTML_PATH, {
    headers: { Accept: "text/markdown" },
  });
  requireStatus(response, "negotiated Markdown");
  requireHeaderIncludes(
    response,
    "Content-Type",
    "text/markdown",
    "negotiated Markdown"
  );
  requireHeaderIncludes(
    response,
    "Content-Type",
    "charset=utf-8",
    "negotiated Markdown"
  );

  if (response.headers.get("Content-Location") !== MARKDOWN_PATH) {
    throw new Error(
      `[production-smoke] negotiated Markdown returned unexpected Content-Location: ${JSON.stringify(response.headers.get("Content-Location"))}.`
    );
  }

  requireHeaderIncludes(response, "Vary", "accept", "negotiated Markdown");
  requireHsts(response, "negotiated Markdown");
  const markdown = await response.text();

  if (!markdown.includes("# Overview")) {
    throw new Error(
      "[production-smoke] negotiated Markdown is missing its expected heading."
    );
  }
};

const checkDirectMarkdown = async () => {
  const response = await request(MARKDOWN_PATH);
  requireStatus(response, "direct Markdown");
  requireHeaderEquals(
    response,
    "Content-Type",
    "text/markdown; charset=utf-8",
    "direct Markdown"
  );
  requireHeaderEquals(
    response,
    "X-Content-Type-Options",
    "nosniff",
    "direct Markdown"
  );
  requireHsts(response, "direct Markdown");

  if (!(await response.text()).includes("# Overview")) {
    throw new Error(
      "[production-smoke] direct Markdown is missing its expected heading."
    );
  }
};

const checkMissingMarkdown = async () => {
  const response = await request("/cache/production-smoke-missing.md");

  if (response.status !== 404) {
    throw new Error(
      `[production-smoke] missing Markdown returned HTTP ${response.status}.`
    );
  }

  requireHeaderIncludes(
    response,
    "Content-Type",
    "text/html",
    "missing Markdown"
  );
  requireHsts(response, "missing Markdown");
  await response.body?.cancel();
};

const checkDiscovery = async () => {
  const response = await request("/.well-known/api-catalog");
  requireStatus(response, "API catalog");
  requireHeaderIncludes(
    response,
    "Content-Type",
    "application/linkset+json",
    "API catalog"
  );
  requireHeaderEquals(
    response,
    "Access-Control-Allow-Origin",
    "*",
    "API catalog"
  );
  requireHeaderAbsent(
    response,
    "Access-Control-Allow-Headers",
    "API catalog"
  );
  requireHeaderAbsent(
    response,
    "Access-Control-Allow-Methods",
    "API catalog"
  );
  requireHsts(response, "API catalog");
  await response.body?.cancel();
};

const checkFingerprintAsset = async (asset) => {
  // Probe the bare fingerprinted path: a cache-busting query could miss a stale
  // edge entry and make the deployed cache policy look healthier than it is.
  const response = await request(asset.pathname);
  requireStatus(response, "fingerprinted asset");
  const directives = new Set(
    (response.headers.get("Cache-Control") ?? "")
      .toLowerCase()
      .split(",")
      .map((value) => value.trim())
  );

  for (const directive of ["public", "max-age=31536000", "immutable"]) {
    if (!directives.has(directive)) {
      throw new Error(
        `[production-smoke] fingerprinted asset has unexpected Cache-Control: ${JSON.stringify(response.headers.get("Cache-Control"))}.`
      );
    }
  }

  requireHsts(response, "fingerprinted asset");
  await response.body?.cancel();
};

let mcpSessionId;
let rpcId = 0;

const getMcpHeaders = () => ({
  Accept: "application/json, text/event-stream",
  "Content-Type": "application/json",
  "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
  ...(mcpSessionId ? { "MCP-Session-Id": mcpSessionId } : {}),
});

const captureMcpSession = (response) => {
  const responseSessionId = response.headers.get("MCP-Session-Id");

  if (!responseSessionId) {
    return;
  }

  if (mcpSessionId && mcpSessionId !== responseSessionId) {
    throw new Error(
      "[production-smoke] MCP changed its session ID during one exchange."
    );
  }

  mcpSessionId = responseSessionId;
};

const callMcp = async (method, params) => {
  rpcId += 1;
  const response = await request(MCP_PATH, {
    body: JSON.stringify({
      id: rpcId,
      jsonrpc: "2.0",
      method,
      ...(params === undefined ? {} : { params }),
    }),
    headers: getMcpHeaders(),
    method: "POST",
  });
  requireStatus(response, `MCP ${method}`);
  captureMcpSession(response);
  requireHeaderIncludes(
    response,
    "Content-Type",
    "application/json",
    `MCP ${method}`
  );
  requireHsts(response, `MCP ${method}`);
  const payload = await response.json();

  if (
    typeof payload !== "object" ||
    payload === null ||
    payload.jsonrpc !== "2.0" ||
    payload.id !== rpcId ||
    "error" in payload ||
    !("result" in payload)
  ) {
    throw new Error(
      `[production-smoke] MCP ${method} returned an invalid JSON-RPC response.`
    );
  }

  return payload.result;
};

const notifyMcpInitialized = async () => {
  const response = await request(MCP_PATH, {
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }),
    headers: getMcpHeaders(),
    method: "POST",
  });

  if (response.status !== 202) {
    throw new Error(
      `[production-smoke] MCP notifications/initialized returned HTTP ${response.status}.`
    );
  }

  captureMcpSession(response);
  requireHsts(response, "MCP notifications/initialized");
  await response.body?.cancel();
};

const checkMcp = async () => {
  mcpSessionId = undefined;
  const initialize = await callMcp("initialize", {
    capabilities: {},
    clientInfo: { name: "astilba-docs-production-smoke", version: "1.0.0" },
    protocolVersion: MCP_PROTOCOL_VERSION,
  });

  if (
    initialize?.protocolVersion !== MCP_PROTOCOL_VERSION ||
    initialize?.serverInfo?.name !== "com.astilba/docs" ||
    typeof initialize?.capabilities?.tools !== "object"
  ) {
    throw new Error(
      "[production-smoke] MCP initialize returned unexpected server capabilities."
    );
  }

  await notifyMcpInitialized();

  const search = await callMcp("tools/call", {
    arguments: { query: "tag invalidation" },
    name: "search_docs",
  });
  const results = search?.structuredContent?.results;

  if (
    !Array.isArray(results) ||
    !results.some(
      (result) =>
        result?.uri ===
        `${CANONICAL_ORIGIN}/cache/tags-and-invalidation.md`
    )
  ) {
    throw new Error(
      "[production-smoke] MCP search_docs did not return the expected documentation resource."
    );
  }
};

const runChecks = async () => {
  const asset = await checkHtml();
  const results = await Promise.allSettled([
    checkMarkdown(),
    checkDirectMarkdown(),
    checkMissingMarkdown(),
    checkDiscovery(),
    checkFingerprintAsset(asset),
    checkMcp(),
  ]);
  const failure = results.find((result) => result.status === "rejected");

  if (failure?.status === "rejected") {
    throw failure.reason;
  }
};

let lastError;

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await runChecks();
    console.log(
      `[production-smoke] HTML, Markdown, edge headers, immutable assets, and MCP passed for ${site.origin}.`
    );
    process.exitCode = 0;
    lastError = undefined;
    break;
  } catch (error) {
    lastError = error;

    if (attempt < attempts) {
      const delay = Math.min(retryDelayMs * 2 ** (attempt - 1), 30_000);
      console.warn(
        `[production-smoke] Attempt ${attempt}/${attempts} failed: ${error instanceof Error ? error.message : String(error)} Retrying in ${delay}ms.`
      );
      await sleep(delay);
    }
  }
}

if (lastError) {
  throw lastError;
}

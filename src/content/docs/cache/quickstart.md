---
title: Quickstart
description: Preview one Cache read from typed drivers to a filled value. Cache is not yet available for production installation.
---

:::caution[Not an installation guide]
Cache cannot yet be installed for production use. This walkthrough previews the public API while its tested Cloudflare components remain internal and unsupported as package imports.
:::

A cache operation starts with explicit runtime dependencies, then reads a key or asks its factory to produce the value.

## Before you start

Every cache instance needs a <code>Clock</code> and <code>Rng</code>. A fill currently also needs an application-supplied L2 <code>Store</code>.

Add a <code>Registry</code> and <code>Bus</code> together when you want coordinated invalidation. That configuration also uses L2 to recover invalidation state after a transport gap. The example below assumes you have supplied those drivers; the internal Cloudflare implementations are not public exports yet.

## Read or fill one article

1. **Create a namespaced cache.** Pass the runtime drivers that host the portable kernel.
2. **Describe the value.** Give the operation a key, an invalidation tag, and a factory.
3. **Use the returned value.** <code>getOrSet</code> resolves to the cached or newly loaded article.

~~~ts title="cache.ts"
import { compound, createCache } from "@astilba/cache";

const cache = createCache({
  namespace: "journal",
  clock,
  rng,
  l2: store,
  registry,
  bus,
})

const article = await cache.getOrSet({
  key: `article:${articleId}`,
  tags: [compound("article", articleId)],
  factory: async ({ signal }) => loadArticle(articleId, signal),
})
~~~

## What the call means

Cache checks its configured tiers for a readable entry. When it cannot serve one, the factory loads the article. The compound tag gives later invalidation a stable dependency target.

## Go deeper

Continue to [Reading and filling](/cache/reading-and-filling/) for the metadata-rich entry form, intentional skips, and the full fill lifecycle.

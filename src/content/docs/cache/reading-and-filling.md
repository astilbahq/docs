---
title: Reading and filling
description: Choose between the simple value API and the metadata-rich entry API.
---

Use <code>getOrSet</code> when you only need the value. Use <code>getOrSetEntry</code> when the caller needs cache metadata or the factory may intentionally skip storage.

## Choose the return shape

### <code>getOrSet</code>

~~~ts
const article = await cache.getOrSet({
  key: `article:${articleId}`,
  tags: [compound("article", articleId)],
  factory: async ({ signal }) => loadArticle(articleId, signal),
})
~~~

### <code>getOrSetEntry</code>

~~~ts
const entry = await cache.getOrSetEntry<string>({
  key: "optional-banner",
  factory: async (ctx) => {
    if (!shouldRenderBanner()) return ctx.skip()
    return loadBanner()
  },
})

if (!entry.skipped) {
  render(entry.value)
}
~~~

| Form | Returns | Use it when |
| --- | --- | --- |
| <code>getOrSet</code> | <code>Promise&lt;T&gt;</code> | You only need the value. Its factory cannot call <code>skip()</code>, so a missing value cannot masquerade as a successful <code>T</code>. |
| <code>getOrSetEntry</code> | Value plus <code>tier</code>, <code>stale</code>, <code>durable</code>, and <code>skipped</code> | The caller needs cache metadata or the factory may intentionally skip storage. |

## Fill lifecycle

1. **Read configured tiers.** Decode and validate an existing envelope before serving it.
2. **Join compatible work.** Concurrent compatible calls share one in-isolate factory execution.
3. **Fence the result.** A hard invalidation visible during the fill prevents that value from being served.
4. **Write by scope.** Shared scopes may reach durable storage; principal-derived values remain local.

## Current boundary

:::note[Bring a store for now]
The kernel currently requires a configured custom L2 <code>Store</code> for fills. The public <code>memory()</code> helper and official production drivers are not shipped.
:::

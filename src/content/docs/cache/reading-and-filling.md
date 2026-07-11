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
| <code>getOrSetEntry</code> | Value plus <code>tier</code>, <code>stale</code>, <code>durable</code>, <code>skipped</code>, <code>age</code>, and optional <code>servedOnError</code> | The caller needs cache metadata or the factory may intentionally skip storage. |

<code>durable: false</code> does not mean the factory failed. It can mean the value was deliberately confined to local memory by its scope, or that a classified transient L2 write failure was suppressed so the caller could still use the result.

## Fill lifecycle

1. **Read configured tiers.** Decode and validate an existing envelope before serving it.
2. **Join compatible work.** Concurrent compatible calls share one in-isolate factory execution.
3. **Fence the result.** A hard invalidation observed during the fill causes the cache to remint and retry within a three-attempt budget. An exhausted plain-value call throws <code>FencedError</code>; the entry form reports a miss.
4. **Write by scope.** Shared scopes may reach durable storage; principal-derived values remain local.

## Compatible concurrent calls

Singleflight joins calls only when their canonical key and structural settings agree. Tags, TTL, grace, negative-cache TTL, scope, codec, consistency, and API form all participate. In development, an incompatible same-key call fails loudly. In production it runs separately and emits telemetry.

## Codec changes become misses

Stored values carry a codec identity. Cache checks that identity before decoding; an unexpected codec becomes a miss instead of a mistyped value. Intentional migrations can allow selected older codec identities through <code>acceptCodecs</code>.

## Current boundary

:::note[Bring a store for now]
The kernel currently requires a configured custom L2 <code>Store</code> for fills. The public <code>memory()</code> helper and supported production driver imports are not shipped.
:::

Factory-provided <code>dependsOn()</code>, <code>setTags()</code>, <code>setTtl()</code>, and <code>reuseGraced()</code> are not usable yet. Entry <code>age</code> also remains a placeholder while full TTL, grace timing, and background refresh adoption are completed.

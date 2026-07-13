---
title: Reading and filling
description: Choose between the simple value API and the metadata-rich entry API.
---

Astilba Cache provides two read APIs. Use <code>getOrSet()</code> when you only need a value. Use <code>getOrSetEntry()</code> when the caller needs cache metadata or the factory may intentionally skip storage.

If terms such as factory, L1, L2, origin, or entry are new, see [Core concepts](/cache/core-concepts/).

## Choose the return shape

### Return a value

~~~ts
const product = await cache.getOrSet({
  key: `product:${productId}`,
  tags: [compound("product", productId)],
  factory: async ({ signal }) => loadProduct(productId, signal),
})
~~~

The factory receives a <code>FactoryCtx</code> without <code>skip()</code>. A skipped result therefore cannot be mistaken for a successful <code>T</code>.

### Return an entry

~~~ts
const entry = await cache.getOrSetEntry<string>({
  key: "optional-banner",
  factory: async (ctx) => {
    if (!shouldRenderBanner()) return ctx.skip()
    return loadBanner()
  },
})

if (!entry.skipped && entry.value !== undefined) {
  render(entry.value)
}
~~~

<code>getOrSetEntry()</code> returns these fields:

| Field | Meaning in the current kernel |
| --- | --- |
| <code>value</code> | The stored, filled, or stale value; <code>undefined</code> for a miss, skip, or negative entry. |
| <code>tier</code> | <code>l1</code>, <code>l2</code>, <code>origin</code>, or <code>miss</code>. <code>l1.5</code> exists in the type but is not emitted by the current implementation. |
| <code>stale</code> | The returned value was not fresh at this read's consistency level. |
| <code>servedOnError</code> | A classified transient failure reused a stale candidate after serve-time revalidation. |
| <code>durable</code> | On an origin result, whether the fill reached shared L2 or a newer durable entry won arbitration. Existing read hits currently report <code>true</code> even for an L1-only entry; treat hit durability metadata as provisional. |
| <code>skipped</code> | The entry-form factory called <code>ctx.skip()</code>; nothing was stored. |
| <code>age</code> | Always <code>0</code> for now; elapsed-time accounting is unfinished. |

On a newly filled origin result, <code>durable: false</code> does not mean the factory failed. It can mean the value was confined to L1 by scope, no L1 existed to retain that private value, or a classified transient L2 write failure was suppressed so the caller could still use the result. The current hit path does not preserve that distinction and reports <code>true</code>; do not use hit-level <code>durable</code> as proof of shared persistence yet.

## Follow the fill lifecycle

1. **Read configured tiers.** Cache tries L1 before L2. It checks the stored codec identity before decoding, then validates the reconstructed entry.
2. **Join compatible work.** Concurrent compatible calls share one in-isolate foreground factory execution.
3. **Run the factory.** The factory receives an <code>AbortSignal</code>, optional request context, and typed failure helpers. The current kernel creates a fresh signal but does not yet abort it on a cache deadline.
4. **Fence the result.** A hard invalidation observed during the fill can reject write-back so the result is not published against obsolete invalidation knowledge.
5. **Write by scope.** Shared scopes may reach L2; principal-derived values are L1-only. A successful fill hydrates L1 when one is configured.

When a plain-value fill is fenced and no value can be served, <code>getOrSet()</code> throws <code>FencedError</code>. <code>getOrSetEntry()</code> reports a non-durable miss instead. The documented snapshot does not rerun the factory inside the same read; the caller may read again.

## Compatible concurrent calls

Singleflight joins calls only when their canonical key and structural settings agree. Tags, TTL, grace, negative-cache TTL, resolved scope, codec identity, consistency, and API form all participate. Tag order does not matter because tags are sorted and deduplicated first.

With <code>dev: true</code>, an incompatible same-key call fails loudly. Otherwise it runs separately and emits <code>singleflight_option_mismatch</code> telemetry.

## Codec changes become misses

Stored values carry a codec identity. Cache checks that identity before decoding, so an unexpected codec becomes a miss instead of a mistyped value. Intentional migrations can allow selected older identities through <code>defaults.acceptCodecs</code>.

The built-in codec is a plain JSON round trip. Use JSON-representable values only: it does not revive dates, classes, functions, or bigint values. Supply a custom <code>Codec</code> with a new identity when you need another wire format; if you accept an older identity, the current decoder must understand those older bytes.

## Current boundaries

:::caution[Time is not enforced yet]
Per-call and default TTL and grace values do not currently expire entries by elapsed time. Stored envelopes use zero timing fields, <code>age</code> remains zero, and a declared <code>notFoundTtl</code> opts into a negative write without enforcing the requested duration.
:::

A soft-stale eventual read currently awaits a best-effort refresh, then still returns the stale value for that call. The planned background adoption and retry lifecycle is not implemented, so this path does not yet provide background stale-while-revalidate latency.

<code>FactoryCtx.dependsOn()</code>, <code>setTags()</code>, and <code>setTtl()</code> are currently no-ops. <code>ctx.graced</code> is not populated and <code>reuseGraced()</code> throws <code>NotImplementedError</code>. Use call-level <code>tags</code> and the documented stale-on-error path instead.

## Related

- [Preview walkthrough](/cache/quickstart/) shows both value reads against a development-only Store.
- [Core concepts](/cache/core-concepts/) explains the storage tiers and read vocabulary.
- [Consistency and resilience](/cache/consistency-and-resilience/) explains when stale values may be reused.
- [API status](/cache/api-status/) lists provisional metadata and unimplemented helpers.

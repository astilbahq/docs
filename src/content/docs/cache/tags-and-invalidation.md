---
title: Tags and invalidation
description: Mark data stale, make it unreadable, or invalidate one canonical key.
---

Tags describe what a value depends on. Invalidation changes how every matching entry may be read without scanning stored values.

## Two verbs, two outcomes

| Operation | Effect |
| --- | --- |
| <code>expire()</code> — soft | Marks matching values stale. An eventual read may serve the stale value while refresh work runs. |
| <code>delete()</code> — hard | Makes matching values unreadable wherever that invalidation is visible. Grace cannot resurrect them. |

~~~ts title="invalidation.ts"
const articleTag = compound("article", articleId)

// Mark matching entries stale.
await cache.expire({ tag: articleTag })

// Make matching entries unreadable.
await cache.delete({ tag: articleTag })

// The key form uses the same invalidation machinery.
await cache.expire({ key: `article:${articleId}` })
~~~

## Build unambiguous tags

<code>compound()</code> encodes each positional part so delimiters and empty values cannot collapse distinct dependency vectors into the same tag.

:::note[Reserved tags stay internal]
User tags beginning with <code>__</code> are rejected. Per-key and per-namespace tags are created by the kernel.
:::

## Clear a namespace

<code>clear()</code> advances the local namespace version and emits a hard namespace invalidation. New keys and lagging readers therefore converge through the same mechanism.

## Adapter status

The invalidation semantics are implemented and verified against deterministic drivers. Real registry and bus adapters are still being built, so this is an API preview rather than a production setup guide.

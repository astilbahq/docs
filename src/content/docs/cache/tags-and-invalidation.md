---
title: Tags and invalidation
description: Mark data stale, make it unreadable, or invalidate one canonical key.
---

Tags describe what a value depends on. Invalidation changes how every matching entry may be read without scanning stored values.

## Two verbs, two outcomes

| Operation | Effect |
| --- | --- |
| <code>expire()</code> — soft | Marks matching values stale. An eventual read may return the stale value while the preview performs a best-effort refresh for a later read. |
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

:::caution[Change the source first]
Invalidating a cached representation does not remove or update the underlying record. Apply the source-of-truth change before issuing a hard invalidation so a refill cannot reproduce the old value.
:::

## Build unambiguous tags

<code>compound()</code> encodes each positional part so delimiters and empty values cannot collapse distinct dependency vectors into the same tag.

:::note[Reserved tags stay internal]
User tags beginning with <code>__</code> are rejected. Per-key and per-namespace tags are created by the kernel.
:::

## Clear a namespace

<code>clear()</code> advances the local namespace version and emits a hard namespace invalidation. New keys and lagging readers therefore converge through the same mechanism.

## Completion status

<code>expire()</code>, <code>delete()</code>, and <code>clear()</code> return an epoch and a best-effort <code>matchedHint</code>. In the current preview, <code>flushed()</code> and <code>edgePurged()</code> resolve without measuring mirror or edge completion. Do not use those promises as deployment guarantees yet.

## Runtime status

The invalidation semantics are implemented and verified against deterministic drivers. A Cloudflare Coordinator and registry client now run in the workerd integration lane, together with a KV replication mirror and conservative reader. The production bus, edge purge path, and supported adapter exports are still missing.

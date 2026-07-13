---
title: Invalidating data
description: Mark dependent values stale, make them unreadable, or invalidate one contextless public key.
sidebar:
  label: Tags and invalidation
---

In Astilba Cache, tags describe what a value depends on. Invalidation advances tag watermarks, so readers can reject matching entries without scanning or deleting every stored value.

The application changes its source of truth; Cache only changes whether stored representations may be served. See [Core concepts](/cache/core-concepts/) for keys, tags, Registry, and Bus.

## Choose soft or hard invalidation

| Operation | Effect |
| --- | --- |
| <code>expire()</code> — soft | Values born before the new soft watermark become stale. An eventual read may return the old value after attempting a refresh for a later read. |
| <code>delete()</code> — hard | Values born before the new hard watermark become unreadable wherever that invalidation is visible. Grace cannot resurrect them. |

~~~ts title="invalidation.ts"
const productTag = compound("product", productId)

// Mark every entry carrying the tag stale.
await cache.expire({ tag: productTag })

// Make every entry carrying the tag unreadable.
await cache.delete({ tag: productTag })
~~~

:::caution[Change the source first]
Invalidating a cached representation does not update or remove the underlying record. Apply the source-of-truth change before issuing a hard invalidation so a refill cannot reproduce the old value.
:::

## Build unambiguous tags

<code>compound()</code> escapes percent signs and delimiters, then prefixes the vector's arity. Delimiter-like values, empty strings, and vectors of different lengths therefore remain distinct.

~~~ts
const productTag = compound("product", productId)
const categoryListingTag = compound("category", categoryId, "listing")
~~~

Caller-supplied tags on <code>getOrSet()</code> and <code>getOrSetEntry()</code> are rejected when they begin with <code>__</code>. The kernel reserves that prefix for its per-key and per-namespace tags. The <code>Tag</code> brand prevents ordinary raw-string selectors; do not bypass it with a type assertion.

## Invalidate by key carefully

The key selector maps a user key to Cache's reserved per-key tag:

~~~ts
await cache.expire({ key: `product:${productId}` })
await cache.delete({ key: `product:${productId}` })
~~~

In the current kernel, that selector resolves the **contextless public** canonical key: it has no request or scope input. It does not target principal-derived or tenant-scoped variants of the same user key. Use a dependency tag when data can exist in more than one scope.

The selector types also expose <code>scope</code> on tag invalidation, but the current implementation does not apply it when resolving the Registry tag. Treat a tag purge as affecting every cached entry carrying that tag; do not rely on scope-qualified tag invalidation yet.

## Clear a namespace

<code>clear()</code> bumps the calling instance's namespace version and issues a hard invalidation for the reserved namespace tag. The version makes old keys unreachable on that instance; the hard watermark makes other readers reject pre-clear entries as the invalidation reaches them.

## Understand the result

<code>expire()</code>, <code>delete()</code>, and <code>clear()</code> return a <code>PurgeResult</code> with an epoch, <code>matchedHint</code>, <code>flushed()</code>, and <code>edgePurged()</code>.

In the current preview:

- <code>matchedHint</code> is always <code>"unknown"</code>;
- <code>flushed()</code> resolves immediately without measuring mirror acceptance;
- <code>edgePurged()</code> resolves immediately without invoking a CDN queue;
- the <code>cdn</code> option on <code>delete()</code> is not wired.

Do not use those completion fields as rollout or takedown guarantees yet.

## Configuration boundary

The purge verbs require a <code>Registry</code>. For reads to observe coordinated invalidation, configure Registry and Bus together. L2 remains required for fills and lets suspect readers replay durable delta batches. The production Bus, CDN path, and supported adapter exports are not implemented.

## Related

- [How Cache works](/cache/how-it-works/) follows invalidation through live delivery and recovery.
- [Consistency and resilience](/cache/consistency-and-resilience/) explains how reads treat stale or unknown knowledge.
- [API status](/cache/api-status/) records the current purge-result and selector limitations.

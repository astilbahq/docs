---
title: Overview
description: Understand what Astilba Cache does, where it runs, and whether it fits your application.
---

Astilba Cache stores the result of expensive server-side work so later calls can reuse it. It is designed for TypeScript applications that read from databases, APIs, or other services and need explicit control over invalidation, failures, and who may share a cached value.

:::caution[Development preview]
<code>@astilba/cache</code> is not published and has no supported production setup. Elapsed TTL and grace periods are not enforced, and ready-made runtime and framework adapters are not available. The current documentation describes the source preview accurately; it is not an installation guide.
:::

## Decide whether Cache fits

| You want to… | Fit |
| --- | --- |
| Reuse a database query or API response on the server | This is the intended use case. |
| Invalidate related server data after a mutation | Tags and soft or hard invalidation are core features. |
| Keep user-specific results out of shared storage | Privacy-aware scopes are built into the key and write path. |
| Cache browser requests or React component state | Use a client data-fetching or state library instead. Astilba Cache is a server-side cache. |
| Add a basic production cache today | Not yet. The package, time-based expiry, and supported runtime adapters must ship first. |

For React applications, “server-side” means code such as a route loader, server action, API route, or Server Component—not code running in the browser. See [React and server apps](/cache/react-and-server-apps/) for that boundary.

## Start with one value

Every basic cache operation has three application-level parts:

1. A **key** identifies the result, such as <code>product:sku-123</code>.
2. A **factory** loads the value when Cache cannot reuse a stored copy.
3. A **store** holds the encoded result for a later call.

~~~ts
const product = await cache.getOrSet({
  key: `product:${productId}`,
  factory: async ({ signal }) => loadProduct(productId, signal),
})
~~~

On a miss, Cache runs <code>loadProduct()</code>, stores its result, and returns it. On a usable hit, it returns the stored value without running the factory.

The current source preview makes you provide the storage, clock, and random source used to construct <code>cache</code>. The [preview walkthrough](/cache/quickstart/) shows that wiring. A future supported runtime adapter should own most of it.

## Add only what you need

| Need | Add | Leave it out when… |
| --- | --- | --- |
| Invalidate related values | Dependency tags and a Registry | Values never need explicit invalidation. |
| Reuse values inside one running server | L1, a local Store | One shared Store is sufficient. |
| Coordinate invalidation across servers | Registry and Bus; keep L2 for fills and durable delta replay | The application has only one cache instance or does not invalidate. |
| Cache user or tenant data | Request identity and an explicit scope where sharing is intended | Every value is truly public and its key covers all inputs. |
| Reuse stale data during an outage | Grace plus a failure classifier | Origin failures should always surface. |
| Coordinate fills across servers | A Lock driver and <code>lock: true</code> | In-process singleflight is enough. |
| Change the wire format | A custom Codec | JSON-representable values are sufficient. |
| Purge a shared HTTP or CDN cache | Planned render collection and CDN integration; this path is not wired yet | You only need application data caching. |

Most application code should begin with <code>getOrSet()</code>. Registry, Bus, locks, codecs, replication, and L3 collection belong to progressively more advanced setups.

## Understand the guarantees

- **Uncertain invalidation knowledge never becomes false freshness.** Cache may perform extra origin work while distributed state reconverges.
- **Soft and hard invalidation are different.** Soft expiry permits refresh and eligible stale fallback; hard deletion makes older values unreadable.
- **Identity affects storage.** Principal-derived values stay in local storage unless the application deliberately declares a shareable scope.
- **Failures are classified.** A transient outage may reuse an eligible stale value; facts such as 403, 404, and 410 remain visible.

Cache does not update your source of truth. Change the database or upstream service first, then invalidate its cached representations.

## Current release status

| Surface | Status | Detail |
| --- | --- | --- |
| Correctness kernel | Implemented | Read, fill, scope, codec, resilience, and invalidation behavior is exercised by deterministic tests. |
| Driver contracts | Implemented | Application and runtime integrations can implement the typed capability boundaries. |
| Cloudflare path | Internal preview | KV storage, the Coordinator, Registry client, and mirror writes run under workerd, but the complete runtime path is not packaged. |
| Public package | Not released | There is no supported installation, framework adapter, or production deployment path. |

## Learn in layers

1. [React and server apps](/cache/react-and-server-apps/) explains where Cache belongs in an application.
2. [Preview walkthrough](/cache/quickstart/) traces the smallest configuration the current source can run.
3. [Core concepts](/cache/core-concepts/) defines keys, stores, L1, L2, Registry, Bus, Clock, and the other building blocks.
4. The guides cover [reading and filling](/cache/reading-and-filling/), [invalidation](/cache/tags-and-invalidation/), and [privacy](/cache/scopes-and-privacy/).
5. Advanced pages explain the [runtime architecture](/cache/architecture/) and [driver status](/cache/drivers-and-status/).
6. [API reference](/cache/api-reference/) documents the complete root export surface; [API status](/cache/api-status/) records what is incomplete.

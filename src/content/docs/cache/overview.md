---
title: Overview
description: Understand what Astilba Cache does, where it runs, and whether it fits your application.
---

Astilba Cache stores the result of expensive server-side work so later calls can reuse it. It is designed for TypeScript applications that read from databases, APIs, or other services and need explicit control over invalidation, failures, and who may share a cached value.

:::caution[Development preview]
<code>@astilba/cache</code> is not published to npm and has no supported production setup. The source tree contains publish-shaped Cloudflare Workers and React Router entry points, but elapsed TTL and grace periods are still not enforced and the full runtime path has not completed its release gates. These docs are a source-preview guide, not a release announcement.
:::

## Decide whether Cache fits

| You want to… | Fit |
| --- | --- |
| Reuse a database query or API response on the server | This is the intended use case. |
| Invalidate related server data after a mutation | Tags and soft or hard invalidation are core features. |
| Keep user-specific results out of shared storage | Privacy-aware scopes are built into the key and write path. |
| Cache browser requests or React component state | Use a client data-fetching or state library instead. Astilba Cache is a server-side cache. |
| Evaluate a Cloudflare Workers integration | The source includes a Workers factory, KV driver, Coordinator Durable Object, live Bus, recovery poller, and React Router middleware. |
| Add a supported production cache today | Not yet. The package, elapsed-time behavior, operational measurements, and release process must complete first. |

For React applications, “server-side” means code such as a route loader, server action, API route, or Server Component—not code running in the browser. The current framework adapter targets React Router v8 on the server; see [React Router](/cache/react-and-server-apps/).

## Start with one value

Every basic cache operation has three application-level parts:

1. A **key** identifies the result, such as <code>product:sku-123</code>.
2. A **factory** loads the value when Cache cannot reuse a stored copy.
3. A **store** holds the encoded result for a later call.

~~~ts
import { compound } from "@astilba/cache"

const product = await cache.getOrSet({
  key: `product:${productId}`,
  tags: [compound("product", productId)],
  factory: async ({ signal }) => loadProduct(productId, signal),
})
~~~

On a miss, Cache runs <code>loadProduct()</code>, stores its result, and returns it. On a usable hit, it returns the stored value without running the factory.

The portable constructor makes you supply storage, a clock, and a random source. The [local quickstart](/cache/quickstart/) shows that explicit wiring. On Workers, <code>createWorkersCache()</code> supplies those platform capabilities and composes the current Cloudflare drivers for you.

## Add only what you need

| Need | Add | Leave it out when… |
| --- | --- | --- |
| Exercise the kernel locally | A bounded <code>memory()</code> Store used as a development L2 | You are wiring a real shared runtime. |
| Run on Cloudflare Workers | <code>createWorkersCache()</code>, a KV namespace, and the Coordinator Durable Object | You are only reviewing the portable API. |
| Use React Router v8 | The root <code>cacheMiddleware()</code> and <code>nodejs_als</code> compatibility flag on Workers | Your framework owns request context another way. |
| Invalidate related values | Dependency tags and a Registry | Values never need explicit invalidation. |
| Reuse values inside one running server | L1, a local Store | One shared Store is sufficient. |
| Coordinate invalidation across servers | Registry and Bus; keep L2 for fills and durable delta replay | The application has only one cache instance or does not invalidate. |
| Cache user or tenant data | Request identity and an explicit scope where sharing is intended | Every value is truly public and its key covers all inputs. |
| Reuse stale data during an outage | Grace plus a failure classifier | Origin failures should always surface. |
| Coordinate fills across servers | A Lock driver and <code>lock: true</code> | In-process singleflight is enough. |
| Change the wire format | A custom Codec | JSON-representable values are sufficient. |
| Tag a shared HTTP response safely | React Router render collection and scope-aware <code>Cache-Tag</code> emission | Your framework owns response dependencies another way. |
| Purge a shared HTTP or CDN cache | A future CDN driver; response tags exist, but purge delivery is not wired yet | You only need application data caching. |

Most application code should begin with <code>getOrSet()</code>. Registry, Bus, locks, codecs, replication, and HTTP response caching belong to progressively more advanced setups. The Workers factory hides most coordination wiring; the raw contracts remain available to adapter authors.

## Understand the guarantees

- **Uncertain invalidation knowledge never becomes false freshness.** Cache may perform extra origin work while distributed state reconverges.
- **Soft and hard invalidation are different.** Soft expiry permits refresh and eligible stale fallback; hard deletion makes older values unreadable.
- **Identity affects storage.** Principal-derived values stay in local storage unless the application deliberately declares a shareable scope.
- **Failures are classified.** A transient outage may reuse an eligible stale value; facts such as 403, 404, and 410 remain visible.
- **Strong reads pay for authority.** With coordinated invalidation configured, they perform a live Registry check before serving a stored entry and before a strong miss is filled.
- **A private dependency makes the rendered response private.** The React Router adapter emits response tags only when every managed dependency has readable public scope.

Cache does not update your source of truth. Change the database or upstream service first, then invalidate its cached representations.

## Current release status

| Surface | Status | Detail |
| --- | --- | --- |
| Correctness kernel | Implemented | Read, fill, scope, codec, resilience, and invalidation behavior is exercised by deterministic tests. |
| Driver contracts | Implemented | Application and runtime integrations can implement the typed capability boundaries. |
| Local memory Store | Implemented in source | <code>memory()</code> provides bounded, per-instance LRU storage and optional physical TTL when given a Clock. |
| Cloudflare path | Public source preview | <code>./cloudflare</code> exports the Workers factory, KV, Coordinator, Registry, Bus, and redial helpers; workerd integration tests cover the primary path. |
| React Router path | Public source preview | <code>./react-router</code> exports server middleware, typed request context access, request-piggyback recovery ticks, and scope-aware response-tag collection. |
| Public package | Not released | npm has no <code>@astilba/cache</code> package, so there is no supported installation or production deployment path. |

## Choose a path

| You want to… | Start with | Continue with |
| --- | --- | --- |
| Decide whether the preview fits | This overview | [Implementation status](/cache/api-status/) |
| Run the smallest current-source example | [Local quickstart](/cache/quickstart/) | [Read and cache values](/cache/reading-and-filling/) |
| Evaluate the runtime adapters | [Cloudflare Workers](/cache/cloudflare-workers/) | [React Router](/cache/react-and-server-apps/) if it is your server framework |
| Add application cache behavior | [Read and cache values](/cache/reading-and-filling/) | [Invalidate cached data](/cache/tags-and-invalidation/) and [Control cache sharing](/cache/scopes-and-privacy/) |
| Tag rendered responses safely | [React Router](/cache/react-and-server-apps/) | [Cache HTTP responses](/cache/response-caching/) |
| Diagnose a value or event | [Inspect cache behavior](/cache/observability/) | [API reference](/cache/api-reference/) |
| Understand the correctness model | [Cache fundamentals](/cache/core-concepts/) | [How Cache works](/cache/how-it-works/) and [Consistency and resilience](/cache/consistency-and-resilience/) |
| Inspect capability and export details | [Runtime architecture](/cache/architecture/) | [Driver implementations](/cache/drivers-and-status/) and [API reference](/cache/api-reference/) |

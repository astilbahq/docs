---
title: React and server apps
description: Decide where Astilba Cache belongs in a React application and what a basic setup should require.
---

Astilba Cache is for server-side work. It can eventually sit around a database query or upstream request used by a React framework, but it is not a browser cache, React state manager, or replacement for a client data-fetching library.

:::caution[Not a supported setup guide yet]
The package and framework adapters are not released, and elapsed TTL is unfinished. This page explains the intended application boundary so you can evaluate the design; it does not describe a production-ready React integration.
:::

## Put Cache on the server

| Code location | Use Astilba Cache? | Why |
| --- | --- | --- |
| Server Component | Intended, once a supported runtime exists | The factory can cache database or API work without shipping Cache to the browser. |
| Route loader or server-side data function | Intended | The cache can live around the origin operation used to build the response. |
| Server action or mutation handler | Intended for invalidation | Update the source of truth, then expire or delete the affected tags. |
| API route or backend service | Intended | It is ordinary server-side TypeScript. |
| Client Component or browser-only SPA | No | Browser request state, refetching, and component lifecycles need a client data library. |

The current kernel receives server capabilities through injected contracts and expects application-supplied storage. Do not import it into a client bundle.

## Picture the basic use

Once a runtime has created a <code>cache</code> instance, application code should stay small:

~~~ts title="load-product.ts"
import { compound } from "@astilba/cache"
import type { Cache } from "@astilba/cache"

export async function getProduct<T>(
  cache: Cache,
  productId: string,
  loadProduct: (productId: string, signal: AbortSignal) => Promise<T>,
): Promise<T> {
  return cache.getOrSet({
    key: `product:${productId}`,
    tags: [compound("product", productId)],
    factory: ({ signal }) => loadProduct(productId, signal),
  })
}
~~~

The application chooses the key, dependencies, and factory. The runtime should supply storage and the other platform capabilities.

After a mutation, change the source first and then invalidate the dependency:

~~~ts title="update-product.ts"
import { compound } from "@astilba/cache"
import type { Cache } from "@astilba/cache"

export async function updateProduct<TInput>(
  cache: Cache,
  productId: string,
  input: TInput,
  saveProduct: (productId: string, input: TInput) => Promise<void>,
): Promise<void> {
  await saveProduct(productId, input)
  await cache.delete({ tag: compound("product", productId) })
}
~~~

That invalidation call currently requires a Registry. Supported framework packages should configure it rather than making every application construct coordination drivers by hand.

## What a basic setup needs

At the application level, the eventual basic path should ask for only:

- a stable namespace for the application or data domain;
- one supported storage preset;
- a key and factory for each cached operation;
- optional tags when the application needs explicit invalidation.

The current source API is lower-level. <code>createCache()</code> requires a <code>Clock</code> and <code>Rng</code>, and a factory fill currently requires an L2 <code>Store</code>. There is no working public <code>memory()</code> helper or supported Node, React, or Cloudflare package entry point. See the [preview walkthrough](/cache/quickstart/) for the exact source wiring.

## What most apps can initially ignore

| Feature | Add it when… |
| --- | --- |
| L1 | You want fast process-local reuse or need to retain principal-derived values locally. |
| Registry | You need <code>expire()</code>, <code>delete()</code>, or <code>clear()</code>. |
| Bus | Several active instances need warm invalidation delivery. It forms a coordinated read path when Registry is also configured; L2 is separately required for fills and enables mirror replay. |
| Strong consistency | A stored entry must pass a live authoritative invalidation check before it is served. |
| Grace and stale-on-error | A transient origin outage may reuse a previously good value. |
| Lock | Several servers may fill the same key and cross-instance exclusion is worth its cost. |
| Custom Codec | The built-in JSON round trip cannot represent your values or wire-migration needs. |
| CDN and L3 collection | You also cache rendered responses in a shared HTTP cache. |
| Telemetry | You need cache-specific operational events. |

These features remain part of the product and are documented explicitly. They do not need to appear in the first successful application example.

## Current answer for a React developer

If you need a production cache in a React application today, Astilba Cache is not ready for that job. The path becomes supportable when the package, elapsed-time behavior, a simple Store, and at least one framework or runtime adapter are released together.

Until then, use these docs to review the API and guarantees, not as a dependency setup guide. Continue with [core concepts](/cache/core-concepts/) for the vocabulary or [API status](/cache/api-status/) for the exact gaps.

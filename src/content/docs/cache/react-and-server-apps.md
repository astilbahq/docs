---
title: React Router
description: Provide Astilba Cache to React Router v8 loaders and actions while carrying server request identity safely.
---

The current source exposes server middleware at <code>@astilba/cache/react-router</code>. It puts a Cache instance into React Router's typed request context, carries an application-derived identity frame, drives background recovery ticks, and marks generated responses private by default.

:::caution[Server adapter, source preview]
This is a React Router v8 server integration. It is not a browser cache, a client data-fetching library, or a released package. The source adapter has unit and real Vite build coverage, but the npm package and production support policy do not exist yet.
:::

## Put Cache on the server

| Code location | Use Astilba Cache? | Why |
| --- | --- | --- |
| Server loader or action | Yes, through the middleware | The factory and invalidation call stay on the server. |
| Server Component or another server framework | Use the portable Cache API | The current framework adapter is specifically for React Router v8. |
| API route or backend service | Yes, through a runtime-owned Cache instance | Cache is ordinary server-side TypeScript. |
| Client Component or browser-only SPA | No | Browser request state and component lifecycles need a client data library. |

Build the Cache instance once for the server runtime. On Cloudflare, use <code>createWorkersCache()</code> as shown in [Cloudflare Workers](/cache/cloudflare-workers/).

## Register the root middleware

React Router v8 middleware is always available; there is no v7 future flag to enable. Register <code>cacheMiddleware()</code> in the root route module:

~~~tsx title="root.tsx"
import { waitUntil } from "cloudflare:workers"
import type { MiddlewareFunction } from "react-router"

import { cacheMiddleware } from "@astilba/cache/react-router"

import { authMiddleware, authenticatedUserContext } from "./auth.server"
import { cache } from "./cache.server"

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
  cacheMiddleware({
    cache,
    waitUntil,
    request: ({ context }) => {
      const user = context.get(authenticatedUserContext)
      return { userId: user.id, tenant: user.tenantId }
    },
  }),
]
~~~

The <code>request</code> mapper is synchronous. Derive identity from a session or typed context that earlier trusted server middleware has already validated; do not treat an arbitrary client header as an authenticated principal.

If a request is intentionally anonymous, return <code>{}</code> or omit the mapper. With no visible principal and no explicit scope, the kernel resolves the call to the public storage class.

## Read in a loader

Use <code>cacheContext</code> to obtain the request's Cache instance. Pass <code>currentRequest()</code> into each read so the kernel can derive its privacy scope:

~~~tsx title="routes/product.tsx"
import type { Route } from "./+types/product"
import { t } from "@astilba/cache"
import {
  cacheContext,
  currentRequest,
} from "@astilba/cache/react-router"

export async function loader({ context, params }: Route.LoaderArgs) {
  const cache = context.get(cacheContext)
  const productId = params.productId

  const product = await cache.getOrSet({
    key: `product:${productId}`,
    tags: [t`product:${productId}`],
    request: currentRequest(),
    factory: ({ signal }) => loadProduct(productId, signal),
  })

  return { product }
}
~~~

<code>currentRequest()</code> returns the frame opened by the root middleware. Outside that frame it returns <code>undefined</code>. Calling <code>context.get(cacheContext)</code> without installing the middleware throws instead of silently constructing another cache.

After a mutation, change the source of truth first and invalidate through the same request Cache:

~~~ts title="routes/product-update.ts"
export async function action({ context, params, request }: Route.ActionArgs) {
  const cache = context.get(cacheContext)
  const productId = params.productId
  const input = await parseProductUpdate(request)

  await saveProduct(productId, input)
  await cache.delete({ tag: t`product:${productId}` })

  return { ok: true }
}
~~~

## Enable AsyncLocalStorage on Workers

The adapter uses <code>AsyncLocalStorage</code> to make <code>currentRequest()</code> available throughout the request's async call tree. On Cloudflare Workers, enable the narrow compatibility flag:

~~~jsonc title="wrangler.jsonc (merge into your existing config)"
{
  "compatibility_flags": ["nodejs_als"]
}
~~~

You do not need the broader <code>nodejs_compat</code> flag for this adapter.

## Keep recovery work off the response path

At request start, the middleware asks the cache's replication poller whether a tick is due. It does not await that work before running loaders. Passing Cloudflare's <code>waitUntil</code> function allows an in-flight tick to continue after the response returns; Cloudflare documents that lifecycle in its [Context API guide](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil).

The adapter limits ticks to at most one per second per Cache instance. The poller's longer baseline, retry, and backoff schedules still decide whether a tick performs I/O. A failed tick is swallowed so it cannot fail the user's response; provide a <code>telemetry</code> sink if you need to observe <code>poll_tick_failed</code> events.

Without <code>waitUntil</code>, the tick is still started but is only best effort after the response lifecycle ends. Recovery does not become unsafe—the read path remains fail closed—but future requests may pay more live-check or refill work.

## Understand the response-cache posture

The current middleware sets <code>Cache-Control: private</code> on a returned <code>Response</code>. That is intentionally conservative: it does not yet prove that a rendered response contains only public data.

It does not currently:

- emit <code>s-maxage</code> or <code>Cache-Tag</code> headers;
- attach <code>cache.collect()</code> to request rendering;
- add cache-hit dependencies to a render collector automatically;
- purge a CDN or other L3 response cache.

Treat the adapter as server value-cache wiring, not shared HTML caching. See [Scopes and privacy](/cache/scopes-and-privacy/) for value storage, [Consistency and resilience](/cache/consistency-and-resilience/) for recovery behavior, and [API status](/cache/api-status/) for current gaps.

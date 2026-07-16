---
title: Cloudflare Workers
description: Compose the current Cache source with Cloudflare KV, a Coordinator Durable Object, and the Workers factory.
---

The current source exposes a Cloudflare entry point at <code>@astilba/cache/cloudflare</code>. Its <code>createWorkersCache()</code> factory combines the portable kernel with a bounded memory L1, Cloudflare KV L2, a Coordinator Durable Object, a live WebSocket Bus, and reconnecting recovery behavior.

:::caution[Implemented in source, not released]
The subpath is part of the package's public source and publish configuration, and its primary path runs under workerd integration tests. The package is still absent from npm, elapsed TTL is incomplete, and the deployment has not completed its production-measurement and release gates.
:::

## See what the factory owns

You provide one stable registry name and two Cloudflare bindings:

~~~ts title="cache.server.ts"
import { env } from "cloudflare:workers"
import { createWorkersCache } from "@astilba/cache/cloudflare"

export const cache = createWorkersCache({
  name: "storefront",
  kv: env.CACHE_KV,
  coordinator: env.COORDINATOR,
})
~~~

The Worker entry must separately export the Durable Object class so Wrangler can bind it:

~~~ts title="worker.ts"
export { Coordinator } from "@astilba/cache/cloudflare"

export default {
  async fetch(): Promise<Response> {
    return new Response("Worker ready")
  },
} satisfies ExportedHandler
~~~

The <code>name</code> is one identity, not a display label. The factory uses it as:

- the named Coordinator Durable Object address;
- the Registry and replication-mirror identifier;
- the Cache namespace used in canonical keys.

Keep it stable for the lifetime of the cache domain. Changing it addresses a different Durable Object and a different keyspace.

The factory also supplies:

- a Workers wall-clock <code>Clock</code> and random <code>Rng</code> at the platform boundary;
- <code>memory({ clock, maxEntries: 512, maxBytes: 5_000_000 })</code> as L1;
- <code>cloudflareKV()</code> as L2;
- <code>doRegistry()</code> against the named Coordinator;
- a self-redialing <code>doBus()</code> connection;
- eventual consistency, live Registry checks for unknown knowledge, the default HTTP retry classifier, and a 30-second reader heartbeat interval unless you override those fields in <code>defaults</code>.

## Configure the Worker bindings

The Worker must export <code>Coordinator</code>, bind that class as a SQLite-backed Durable Object, and make one KV namespace visible under two binding names:

~~~jsonc title="wrangler.jsonc"
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "storefront-worker",
  "main": "src/worker.ts",
  "compatibility_date": "2026-07-15",

  "durable_objects": {
    "bindings": [
      { "name": "COORDINATOR", "class_name": "Coordinator" }
    ]
  },

  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["Coordinator"] }
  ],

  "kv_namespaces": [
    { "binding": "CACHE_KV", "id": "<your-kv-namespace-id>" },
    { "binding": "REGISTRY_KV", "id": "<your-kv-namespace-id>" }
  ],

  "vars": {
    "REGISTRY_HEARTBEAT_MS": "30000"
  }
}
~~~

Both KV bindings point to the same namespace. <code>CACHE_KV</code> is the L2 Store the reader sees; <code>REGISTRY_KV</code> is where the Coordinator writes replication pointers, deltas, and snapshots. If they point at different namespaces, the reader cannot recover from the mirror the Coordinator produced.

New Durable Object classes use <code>new_sqlite_classes</code>. See Cloudflare's [Durable Object migration guide](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/) before merging this into an existing migration history.

## Decide whether to enable idle heartbeats

<code>createWorkersCache()</code> configures the reader to expect a 30-second heartbeat interval. The Coordinator cannot set its own deployment variables, so you must separately opt its idle heartbeat in with:

~~~jsonc
"vars": { "REGISTRY_HEARTBEAT_MS": "30000" }
~~~

Leaving the variable unset keeps idle heartbeats dormant. That avoids a recurring Durable Object alarm and KV write for every idle registry, but a reader can become conservatively suspicious and pay for live checks until it reconverges. Setting it to <code>30000</code> matches the factory's reader default.

If you override <code>defaults.heartbeatInterval</code>, update the deployment variable deliberately as well. The two settings are not synchronized by the library.

## Use the cache in a Worker

Once constructed, application code uses the same portable API:

~~~ts title="load-product.ts"
import { t } from "@astilba/cache"
import { cache } from "./cache.server"

export async function getProduct(productId: string) {
  return cache.getOrSet({
    key: `product:${productId}`,
    tags: [t`product:${productId}`],
    factory: ({ signal }) => loadProduct(productId, signal),
  })
}
~~~

After updating the source of truth, invalidate the same dependency:

~~~ts
await saveProduct(productId, input)
await cache.delete({ tag: t`product:${productId}` })
~~~

The mutation reaches the authoritative Coordinator. Active isolates receive live Bus events; suspect readers can recover through the KV mirror. A strong read performs a live check before serving a stored entry and before filling a strong miss.

## Know the operational boundary

The source path currently includes:

- KV value-size rejection and write-failure classification;
- Coordinator command journaling, coalesced flushes, snapshots, and Registry RPC;
- WebSocket Bus delivery with scope checks and jittered redial backoff;
- reactive read-path recovery plus an out-of-band polling state machine;
- a request-piggyback poll driver when the React Router middleware is used.

It does not yet provide:

- an npm release or supported upgrade policy;
- elapsed TTL, grace, or age enforcement;
- journal checkpointing and truncation for a long-lived Coordinator;
- a production Lock or CDN purge driver;
- an end-to-end CDN purge path, even though the React Router adapter now emits safe <code>Cache-Tag</code> headers;
- the chaos demo and deployed consistency measurements that complete the Workers release path.

Continue with [React Router](/cache/react-and-server-apps/) if that is your server framework, [Cache HTTP responses](/cache/response-caching/) for the response-tag safety model, [Driver implementations](/cache/drivers-and-status/) for component-level status, or [Implementation status](/cache/api-status/) for kernel limitations.

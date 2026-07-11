---
title: Drivers and runtime status
description: See which driver contracts exist and how far each runtime integration has progressed.
sidebar:
  label: Drivers and status
---

The kernel depends on small typed contracts. Runtime adapters can change without duplicating the cache behavior they host.

## Driver model

<code>Store</code>, <code>Registry</code>, <code>Bus</code>, <code>Lock</code>, <code>Codec</code>, and <code>Cdn</code> are public contracts. <code>Clock</code> and <code>Rng</code> keep time and randomness explicit.

~~~ts title="store.ts"
interface Store {
  get(key: string): Promise<StoreValue | undefined>
  set(
    key: string,
    value: string,
    options?: StoreWriteOptions,
  ): Promise<void>
  delete(key: string): Promise<void>
}
~~~

Classified writes use the structural <code>StoreWriteError</code> contract. A retryable throttle or availability failure may leave a successful fill at <code>durable: false</code>; an oversized value is rejected rather than truncated.

## Runtime implementation status

| Surface | Status | Detail |
| --- | --- | --- |
| Driver contracts | Implemented | <code>Store</code>, <code>Registry</code>, <code>Bus</code>, <code>Lock</code>, <code>Codec</code>, and <code>Cdn</code> define the portable boundary. |
| Cloudflare KV store | Internal preview | The real KV-backed <code>Store</code> passes conformance and workerd integration tests, including classified writes and the 60-second residency floor. |
| Coordinator and DO registry | Internal preview | The Durable Object journals registry mutations, runs coalesced flush alarms, writes the KV mirror, and passes the registry contract through its RPC client. |
| Replication reader | Internal preview | Registry-scoped pointers and delta batches rebuild local invalidation knowledge; missing data keeps the reader conservative. Snapshot loading remains incomplete. |
| Durable Object bus | Not implemented | The transport contract exists, but the Coordinator does not yet deliver broadcast effects to production subscribers. |
| Redis, CDN, and framework adapters | Not implemented | No supported integration or package entry point exists yet. |

## Availability boundary

The Cloudflare files are exercised against real workerd bindings, but they are not exported through the package. The integration worker is a test host, not a deployment template.

Do not import adapter files by their source paths. Wait for a supported package subpath and installation guide.

## Still required for a complete Workers path

- Production bus delivery and transport lifecycle
- Supported Cloudflare package exports and deployment configuration
- Snapshot recovery and long-lived journal maintenance
- Background refresh adoption and completion tracking
- Deployed consistency measurements

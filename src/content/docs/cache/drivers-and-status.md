---
title: Drivers and runtime status
description: See the portable contracts, the tested Cloudflare internals, and what is still missing from a deployable runtime path.
sidebar:
  label: Drivers and status
---

The Astilba Cache kernel depends on small typed contracts. Runtime adapters can change without duplicating the cache semantics they host.

## Driver model

| Contract | Role |
| --- | --- |
| <code>Store</code> | L1, L2, and replication-mirror key/value I/O. |
| <code>Registry</code> | Authoritative tag checks and soft or hard mutations. |
| <code>Bus</code> | Ordered live invalidation events, resets, and declared gaps. |
| <code>Lock</code> | Optional cross-isolate exclusion with a monotone fence token. |
| <code>Codec</code> | Value encoding plus a wire identity checked before decode. |
| <code>Cdn</code> | Planned edge purge queue boundary; not wired today. |
| <code>Clock</code>, <code>Rng</code> | Explicit time and randomness for portable, deterministic behavior. |

~~~ts title="store.ts"
interface Store {
  get(key: string, readKind?: ReadKind): Promise<StoreValue | undefined>
  set(
    key: string,
    value: string,
    options?: StoreWriteOptions,
  ): Promise<void>
  delete(key: string): Promise<void>
}
~~~

The optional <code>readKind</code> tells a driver whether a replication read targets the mutable pointer or an immutable delta or snapshot. Entry reads omit it.

Classified writes use the structural <code>StoreWriteError</code> shape. <code>throttled</code> and <code>unavailable</code> failures may leave a successful fill at <code>durable: false</code>; <code>too_large</code> is permanent and propagates rather than truncating the value.

## Runtime implementation status

| Surface | Status | Detail |
| --- | --- | --- |
| Portable contracts and kernel | Implemented in source | The public types, read/fill path, invalidation rules, codecs, scopes, singleflight, and write classification are exercised by deterministic tests. |
| Cloudflare KV Store | Internal preview | The real KV-backed <code>Store</code> passes applicable conformance and workerd tests. It enforces the 25 MiB value limit, floors supplied write residency at 60 seconds, and selects read-cache hints by mirror-object kind. |
| Coordinator Durable Object | Internal preview | The DO journals Registry commands, coalesces flush alarms, writes registry-scoped delta batches and snapshots, advances one terminal pointer, and serves live Registry RPC checks. |
| DO Registry client | Internal preview | The thin RPC client passes the Registry contract against the Coordinator under workerd. |
| Replication reader | Internal preview | The reader replays deltas, bridges holes with a blessed snapshot, fails closed on missing or corrupt data, and supports a bounded retry ladder. Reads can trigger bounded reactive resync. |
| Replication poller | Implemented but undriven | The timer-free poller and jittered retry ladder exist, but no supported request or framework adapter drives its ticks. |
| Durable Object Bus | Not implemented | The transport contract exists, but the Coordinator intentionally drops broadcast effects because there are no production subscribers yet. |
| Memory, Redis, Lock, CDN, and framework adapters | Not implemented or unsupported | No supported package entry point or deployment guide exists for these paths. |

## Cloudflare availability boundary

The Cloudflare files are exercised against workerd bindings, but they are not exported through a supported package subpath. The integration worker is a test host, not a deployment template. Do not import adapter source files directly.

The replication snapshot path is implemented. The remaining durability concern is different: the Coordinator still replays an append-only command journal and does not yet checkpoint and truncate it for long-lived production operation.

## Still required for a complete Workers path

- Production Bus delivery, reconnect, backpressure, and subscriber lifecycle
- Supported Cloudflare package exports and deployment configuration
- A public driver for replication poll ticks
- Coordinator journal checkpointing and truncation
- Background refresh adoption, retry, and completion tracking
- CDN purge queue and honest completion promises
- Deployed measurements for platform consistency and caching assumptions

## Related

- [Runtime architecture](/cache/architecture/) shows how these contracts compose around one cache instance.
- [How Cache works](/cache/how-it-works/) follows storage, invalidation, and recovery through the kernel.
- [API status](/cache/api-status/) lists kernel-level limitations independent of a runtime adapter.

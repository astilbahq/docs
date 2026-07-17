---
title: Driver implementations
description: See which Cache drivers and runtime adapters exist in current source and which production boundaries remain open.
---

Astilba Cache keeps its semantics behind small contracts, then implements platform I/O at adapter boundaries. This page separates an implemented source driver from a released, supported integration.

Application developers can begin with [Cache fundamentals](/docs/cache/core-concepts/). Runtime authors and production-readiness reviewers should use this page together with [Implementation status](/docs/cache/api-status/).

## Understand the driver model

| Contract | Role |
| --- | --- |
| <code>Store</code> | Key/value I/O for local L1, shared L2, and replication-mirror objects. An optional <code>ReadKind</code> lets a driver choose different read-cache policy for a mutable pointer and immutable deltas or snapshots. |
| <code>Registry</code> | The authoritative record used for live tag checks and soft or hard mutations. Its <code>regId</code> scopes recovery objects. |
| <code>Bus</code> | Delivers ordered frames plus reset, hello, and gap signals. The kernel—not the transport—validates continuity. |
| <code>Lock</code> | Optional cross-isolate exclusion with a monotone fence token. |
| <code>Codec</code> | Value encoding plus a wire identity checked before decode. |
| <code>Cdn</code> | Planned edge-purge queue boundary; not wired today. |
| <code>Clock</code>, <code>Rng</code> | Explicit time and randomness for portable, deterministic kernel behavior. |

The base Store shape is small:

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

Classified writes use the structural <code>StoreWriteError</code> shape. <code>throttled</code> and <code>unavailable</code> failures may leave a successful fill at <code>durable: false</code>; <code>too_large</code> is permanent and propagates rather than truncating the value.

## Check each implementation

| Surface | Current source status | What is covered |
| --- | --- | --- |
| Portable kernel and contracts | Implemented | Deterministic invariant, scenario, unit, and conformance lanes cover the public read, fill, invalidation, scope, codec, recovery, and failure behavior. |
| <code>memory()</code> | Implemented root export | Per-instance LRU Store with <code>maxEntries</code> and UTF-8 <code>maxBytes</code> limits. With an injected Clock it also honors Store-level <code>expirationTtl</code>. |
| <code>cloudflareKV()</code> | Public source preview | KV-backed Store with metadata round trips, a 25 MiB value ceiling, write classification, 60-second minimum write residency, and intent-specific mirror read-cache hints. |
| <code>Coordinator</code> | Public source preview | SQLite-backed Durable Object host for Registry RPC, a replayable command journal, coalesced flush alarms, mirror deltas and snapshots, and WebSocket fan-out. |
| <code>doRegistry()</code> | Public source preview | Thin Registry RPC client scoped to the named Coordinator. It passes the Registry contract under workerd. |
| <code>doBus()</code> | Public source preview | Mechanism-only WebSocket Bus client with wire validation, Registry identity checks, and close reporting. |
| <code>redialingDoBus()</code> | Public source preview | Reconnects the DO Bus with injected jitter and exponential backoff capped at 300 seconds. |
| Replication reader | Implemented kernel path | Replays contiguous deltas, escalates persistent holes to a pointer-blessed snapshot, replays the tail, and remains fail closed on corrupt or unfillable chains. |
| Replication poller | Implemented internal seam | Runs baseline pointer observation, bounded recovery retries, snapshot escalation, and failure backoff from externally supplied ticks. |
| <code>createWorkersCache()</code> | Public source preview | Composes the Workers Clock/Rng, memory L1, KV L2, named Coordinator Registry, and redialing Bus. |
| React Router middleware | Public source preview | Supplies Cache through typed Router context, carries request identity, fires request-piggyback poll ticks, collects served dependencies, emits eligible <code>Cache-Tag</code> headers, and demotes unsafe responses. |
| Redis, production Lock, and CDN drivers | Not implemented | Contracts exist, but no package subpaths or production implementations are present. |

“Public source preview” means the symbol is present in the package export map and publish configuration, not that consumers can install it. npm still has no <code>@astilba/cache</code> package.

## Understand Cloudflare-specific behavior

The Cloudflare path uses one named Coordinator identity for the Durable Object address, Registry scope, and Cache namespace. The KV binding used by <code>createWorkersCache()</code> must expose the same namespace that the Coordinator receives as <code>REGISTRY_KV</code>; otherwise the reader and writer see different recovery mirrors.

The KV Store uses different **read-cache hints** for recovery objects:

- mutable pointer reads use the platform's 30-second minimum, reduced from 60 seconds in January 2026;
- immutable deltas and snapshots use 24 hours;
- ordinary value reads do not supply a hint and inherit the platform default.

These read hints are distinct from physical write residency. The Coordinator writes immutable delta batches with a 48-hour <code>expirationTtl</code>, snapshots with seven days, and its mutable pointer with no expiration. The KV driver floors any supplied write residency to Cloudflare's 60-second minimum.

See Cloudflare's [reduced minimum cacheTtl announcement](https://developers.cloudflare.com/changelog/post/2026-01-30-kv-reduced-minimum-cachettl/) for the read-cache change and [KV write API](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) for write residency, value size, and rate limits.

The Coordinator can refresh an idle pointer through <code>REGISTRY_HEARTBEAT_MS</code>. This is disabled unless the deployment sets the variable. The Workers factory independently defaults its reader heartbeat interval to 30 seconds, so matching the Coordinator value is an operator action, not an automatic handshake.

See [Cloudflare Workers](/docs/cache/cloudflare-workers/) for the binding and migration example.

## Know the recovery scheduling model

The kernel poller contains no timer. A runtime hands it ticks so portable code never reads ambient time or schedules work.

The React Router adapter fires a tick at request start, at most once per second per Cache instance, and does not await it on the response path. The poller itself applies the longer baseline cadence and bounded retry schedule. Failed tick work is swallowed and can emit <code>poll_tick_failed</code> telemetry.

A runtime that does not use the React Router adapter still has reactive recovery: a suspect read performs one bounded fast resync attempt. It does not receive proactive baseline polls unless another driver calls the internal tick seam.

## Keep the release boundary visible

The Workers path still needs work before a production release:

- elapsed TTL, grace, age, and negative-entry expiry;
- Coordinator journal checkpointing and truncation;
- a CDN purge queue and completion promises that track real acceptance—the response adapter now emits safe tags, but does not deliver purges;
- a production Lock driver and the deferred Redis/Valkey path;
- the chaos demo and deployed consistency measurements;
- an npm release, compatibility policy, deployment guide, and upgrade process.

The integration Worker and React Router fixture prove runtime wiring and build compatibility; they are not application templates. Do not import deep adapter files. Use only the root, <code>./cloudflare</code>, and <code>./react-router</code> entry points documented here.

## Related

- [Runtime architecture](/docs/cache/architecture/) shows how these capabilities compose around one Cache instance.
- [Cloudflare Workers](/docs/cache/cloudflare-workers/) provides the current factory and binding walkthrough.
- [React Router](/docs/cache/react-and-server-apps/) explains request context and poll ticks.
- [Cache HTTP responses](/docs/cache/response-caching/) explains automatic render collection and header behavior.
- [Inspect cache behavior](/docs/cache/observability/) covers driver and adapter telemetry.
- [API reference](/docs/cache/api-reference/) lists the root and adapter exports.
- [Implementation status](/docs/cache/api-status/) lists kernel-level limitations independent of a driver.

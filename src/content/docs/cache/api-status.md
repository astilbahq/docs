---
title: API status
description: Check which Astilba Cache methods, options, and helpers work in the current unreleased source build.
---

Astilba Cache is unreleased. The portable correctness kernel is active, while time-based expiry, convenience helpers, completion tracking, and production integrations remain incomplete.

Use this page as the preview ledger. “Implemented” means the behavior exists in the public source and is exercised by its test lanes; it does not mean the package has a supported installation or production runtime.

## Configuration requirements

| Requirement | Current boundary |
| --- | --- |
| <code>namespace</code>, <code>clock</code>, <code>rng</code> | Required by <code>createCache()</code>. |
| <code>l2</code> | Required when a read must run its factory. Without L2, a fill throws <code>NotImplementedError</code>. |
| <code>l1</code> | Optional. Required if principal-derived, L1-only values should survive beyond the current call. |
| <code>registry</code> | Required by <code>expire()</code>, <code>delete()</code>, and <code>clear()</code>. |
| <code>registry</code> + <code>bus</code> + <code>l2</code> | Required as a set for coordinated read validation and replication recovery. Registry plus Bus without L2 throws during construction. Supplying only Registry or only Bus does not build the invalidation reader. |

## Implemented in the kernel

| Surface | Current behavior |
| --- | --- |
| <code>createCache()</code> | Builds the cache facade, optional invalidation reader, retention registration, and internal replication poller from application-supplied drivers. |
| <code>getOrSet()</code> | Reads L1 then L2 or fills a value with compatible in-isolate singleflight. A fenced terminal miss throws <code>FencedError</code>. |
| <code>getOrSetEntry()</code> | Adds <code>skip()</code> and returns value, tier, stale, durability, skip, age, and optional error-serve metadata. |
| <code>expire()</code>, <code>delete()</code>, <code>clear()</code> | Apply soft, hard, and namespace invalidation through a supplied Registry. |
| <code>collect()</code> | Records required L3 tags and decides late-tag or byte/count budget eligibility at header commit. No supported framework adapter feeds it automatically. |
| <code>compound()</code> | Produces unambiguous positional tags and rejects reserved user-tag prefixes at the cache boundary. |
| <code>httpError()</code>, <code>isRetriableHttp()</code> | Preserve HTTP status information and implement the default stale-on-error classifier. |
| Custom <code>Codec</code> and <code>Lock</code> | Participate in decode safety, fill identity, cross-isolate exclusion, and write arbitration. |
| Telemetry | Emits plain events or HMAC-pseudonymizes hosted string fields when a salt is configured. |

Scope resolution, negative-entry safety, serve-time stale revalidation, codec identity checks, classified L2 write failures, strong live checks, eventual fail-closed behavior, and fence-taught retries are also implemented.

## Partial or provisional behavior

| Surface | Current boundary |
| --- | --- |
| TTL, grace, and <code>age</code> | Options and types exist, but stored timing fields are zero, elapsed expiry is not enforced, and entry age is always zero. Defaults for TTL and grace are not applied. |
| Default consistency | Per-call <code>consistency</code> works. <code>defaults.consistency</code> is declared but not consumed, so an omitted call option remains eventual. |
| <code>notFoundTtl</code> | Its presence opts an <code>HttpError</code> with status 404 into a negative write, but the declared duration is not enforced. Negative entries remain excluded from grace and stale-on-error. |
| Eventual stale refresh | The stale value is returned, but refresh work is currently awaited. Background adoption, queue retry, and latency decoupling are incomplete. |
| Factory cancellation and grace context | The factory receives a fresh <code>AbortSignal</code>, but the kernel does not abort it on a cache deadline. <code>ctx.graced</code> is not populated. |
| Entry durability metadata | Origin fills report private or suppressed L2 writes as <code>durable: false</code>. Existing L1/L2 hit paths currently report <code>true</code> unconditionally, so hit-level durability is not proof that a shared copy exists. |
| Unknown error posture | <code>unknownPolicy: "error"</code> and <code>takedownSensitive</code> select an error resolution in configuration, but the current read path still continues as a miss. <code>RegistryUnavailableError</code> is exported but not emitted. |
| <code>collect()</code> | The standalone budget decision works. Cache hits do not automatically contribute tags, and no supported request adapter owns header commit. |
| Purge result | <code>matchedHint</code> is always <code>"unknown"</code>; <code>flushed()</code> and <code>edgePurged()</code> resolve without tracking real completion. |
| Key invalidation | <code>{ key }</code> targets the contextless public canonical key only. Use dependency tags for tenant or principal-derived variants. |
| Scope-qualified tag selectors | The selector type accepts <code>scope</code>, but the current Registry tag resolution ignores it. A tag purge affects every entry carrying that tag. |
| Lock option | <code>lock: true</code> uses a configured Lock; without one it silently continues without cross-isolate locking. No production Lock adapter is exported. |
| Replication poller | Constructed internally and fully tick-driven, but not exposed to a supported adapter. Reactive read-time resync still runs. |
| Cloudflare adapters | KV, Coordinator, DO Registry, snapshots, and reader recovery are implemented internally and tested under workerd, but are not supported package entry points. |
| Coordinator journal | Durable and replayable, but still append-only without production checkpointing or truncation. |

## Throwing placeholders

These value exports or methods currently throw <code>NotImplementedError</code>:

- <code>memory()</code>, <code>t</code>, <code>globalTag()</code>, and <code>duration()</code>
- <code>expireAll()</code>, <code>deleteAll()</code>, and <code>explain()</code>
- <code>FactoryCtx.reuseGraced()</code>
- a factory fill with no L2 Store
- <code>expire()</code>, <code>delete()</code>, or <code>clear()</code> without a Registry

## Declared but inert surfaces

These APIs currently return normally or exist in the types but do not apply their intended behavior:

- <code>FactoryCtx.dependsOn()</code>, <code>setTags()</code>, and <code>setTtl()</code> are no-ops.
- <code>CacheConfig.cdn</code> and the <code>cdn</code> mode on <code>delete()</code> do not invoke a CDN driver.
- <code>defaults.graceBackoff</code> and <code>defaults.onUnavailable</code> are not consumed.
- <code>Tier</code> includes <code>"l1.5"</code>, but the current read path does not emit it.

<code>expireAll()</code> and <code>deleteAll()</code> still require their explicit origin-load guard at the type level, but the methods do not run yet.

## Integrations not present

There is no supported Memory, Redis, CDN, production Bus, React Router, demo, or deployed-probe package path. The internal Cloudflare test worker is not an application template.

:::note[Development tags are not package releases]
Repository tags record engineering milestones. Keep using the Unreleased documentation until an installable package release and supported driver entry points exist.
:::

## Related

- [API walkthrough](/cache/quickstart/) demonstrates the smallest current source configuration.
- [Runtime architecture](/cache/architecture/) maps configuration requirements to capability contracts.
- [Drivers and runtime status](/cache/drivers-and-status/) separates public contracts from internal integrations.

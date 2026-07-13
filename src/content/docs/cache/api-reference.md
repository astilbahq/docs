---
title: API reference
description: Reference every export from the documented @astilba/cache preview snapshot.
---

This page documents the complete root export surface for this documentation's preview snapshot. Start with the [overview](/cache/overview/) or [preview walkthrough](/cache/quickstart/) if you are learning the library; use this page when you need an exact method, option, result field, or driver contract.

:::caution[Unreleased and unevenly implemented]
<code>@astilba/cache</code> is not published. Some declarations describe the intended API but currently throw or do not apply their full behavior. Each section calls out important boundaries; [API status](/cache/api-status/) is the authoritative implementation ledger.
:::

## Create a cache

### <code>createCache(config)</code>

Creates a <code>Cache</code> instance from application-supplied capabilities.

~~~ts
const cache = createCache({
  namespace: "storefront",
  clock,
  rng,
  l2: store,
})
~~~

The current implementation requires <code>namespace</code>, <code>clock</code>, and <code>rng</code>. A factory fill also requires <code>l2</code>; without it, the fill throws <code>NotImplementedError</code>.

### <code>CacheConfig</code>

| Field | Type | Meaning and current boundary |
| --- | --- | --- |
| <code>namespace</code> | <code>string</code> | Required stable boundary for canonical keys and namespace invalidation. |
| <code>clock</code> | <code>Clock</code> | Required source of logical time. |
| <code>rng</code> | <code>Rng</code> | Required source of randomness. |
| <code>l1</code> | <code>Store</code> | Optional local tier. Retains principal-derived values that cannot be written to shared storage. |
| <code>l2</code> | <code>Store</code> | Shared or durable tier. Currently required whenever a factory runs and can also hold replication-mirror objects for recovery. |
| <code>registry</code> | <code>Registry</code> | Authoritative invalidation driver. Required by the purge methods. |
| <code>bus</code> | <code>Bus</code> | Live invalidation delivery. Coordinated validation is built when a Registry is also configured; L2 separately enables mirror resync and is required for factory fills. |
| <code>cdn</code> | <code>Cdn</code> | Declared L3 purge capability; not invoked by the current kernel. |
| <code>lock</code> | <code>Lock</code> | Optional cross-instance fill lock. A read opts in with <code>lock: true</code>. |
| <code>codec</code> | <code>Codec</code> | Value encoder and wire identity. Defaults to the built-in JSON round trip. |
| <code>defaults</code> | <code>CacheDefaults</code> | Instance policy defaults. Several timing and unavailable-policy fields remain partial. |
| <code>telemetry</code> | <code>TelemetrySink \| TelemetryConfig</code> | Receives operational events. Hosted mode pseudonymizes string fields when a salt is present. |
| <code>takedownSensitive</code> | <code>boolean</code> | Selects the provisional unknown-as-error posture unless explicitly overridden. It currently continues as a miss rather than throwing. |
| <code>dev</code> | <code>boolean</code> | Makes incompatible same-key singleflight calls fail loudly and guards request reads inside explicitly public factories. |

### <code>CacheDefaults</code>

| Field | Meaning and current boundary |
| --- | --- |
| <code>ttl</code> | Default freshness duration. Declared but not applied; elapsed expiry is unfinished. |
| <code>grace</code> | Default stale window. Declared but not applied; elapsed grace is unfinished. |
| <code>maxEntryRetention</code> | Maximum retention registered when a Registry is configured. It has no registration target without that driver. |
| <code>consistency</code> | Declared default consistency. The current read path ignores it and defaults an omitted per-call option to eventual. |
| <code>unknownPolicy</code> | Chooses <code>registry-check</code>, <code>miss</code>, or the provisional <code>error</code> posture for unknown invalidation knowledge. |
| <code>staleIfError</code> | Replaces the default <code>isRetriableHttp()</code> failure classifier. |
| <code>graceBackoff</code> | Declared retry backoff for grace behavior; not consumed today. |
| <code>maxSyncLag</code> | Declared maximum synchronization lag. The documented snapshot does not consume it. |
| <code>acceptCodecs</code> | Additional stored codec identities the current Codec is allowed to decode. |
| <code>heartbeatInterval</code> | Declared coordination heartbeat interval. The documented snapshot does not consume it. |
| <code>onUnavailable</code> | Declares strong-read degradation to eventual; not consumed today. |

## Read or fill values

### <code>Cache</code> methods

| Method | Returns | Current behavior |
| --- | --- | --- |
| <code>getOrSet(options)</code> | <code>Promise&lt;T&gt;</code> | Returns a usable hit or runs the factory. A terminal fenced fill throws <code>FencedError</code>. |
| <code>getOrSetEntry(options)</code> | <code>Promise&lt;CacheEntry&lt;T&gt;&gt;</code> | Adds <code>skip()</code> and returns read metadata. A terminal fenced fill becomes a miss entry. |
| <code>expire(selector)</code> | <code>Promise&lt;PurgeResult&gt;</code> | Applies a soft invalidation through Registry. |
| <code>delete(selector)</code> | <code>Promise&lt;PurgeResult&gt;</code> | Applies a hard invalidation through Registry. CDN modes are not wired. |
| <code>clear()</code> | <code>Promise&lt;PurgeResult&gt;</code> | Bumps the local namespace version and hard-invalidates the reserved namespace tag. |
| <code>expireAll(guard)</code> | <code>Promise&lt;PurgeResult&gt;</code> | Declared with an explicit origin-load acknowledgement; currently throws <code>NotImplementedError</code>. |
| <code>deleteAll(guard)</code> | <code>Promise&lt;PurgeResult&gt;</code> | Declared with an explicit origin-load acknowledgement; currently throws <code>NotImplementedError</code>. |
| <code>collect()</code> | <code>RenderCollector</code> | Creates an L3 tag collector. The budget decision works, but Cache hits and framework header commit are not integrated. |
| <code>explain(key)</code> | <code>Promise&lt;Explanation&gt;</code> | Intended to report dependencies and applied replication positions; currently throws <code>NotImplementedError</code>. |

### Read option types

<code>GetOrSetOptions&lt;T&gt;</code> and <code>GetOrSetEntryOptions&lt;T&gt;</code> extend <code>GetOptions</code> with their respective factory type.

| <code>GetOptions</code> field | Meaning and current boundary |
| --- | --- |
| <code>key</code> | Required application-facing key. Namespace, scope, and namespace version are added internally. |
| <code>tags</code> | Optional dependency tags. Use branded values created by the tag helpers. |
| <code>ttl</code> | Intended freshness duration. It participates in singleflight compatibility but elapsed time is not enforced. |
| <code>grace</code> | Opts a stale candidate into classified error fallback. The declared duration is not enforced. |
| <code>notFoundTtl</code> | Its presence allows an <code>HttpError</code> 404 to become a negative entry. The duration is not enforced. |
| <code>scope</code> | <code>"public"</code> or <code>{ tenant }</code>. When omitted, visible identity derives a principal-local scope; contextless work resolves public. |
| <code>consistency</code> | <code>"eventual"</code> or <code>"strong"</code>. Strong live-checks a stored entry when coordinated invalidation is active; the documented snapshot does not add a separate pre-fill check on a bare miss. |
| <code>lock</code> | Requests a configured cross-instance Lock. Without a driver, <code>true</code> currently continues unlocked. |
| <code>request</code> | Adapter-provided <code>RequestContext</code> used for identity derivation and the development public-scope guard. |
| <code>factory</code> | Async origin loader. Its context is <code>FactoryCtx&lt;T&gt;</code> or <code>EntryFactoryCtx&lt;T&gt;</code>. |

The exported option types are <code>GetOptions</code>, <code>GetOrSetOptions</code>, and <code>GetOrSetEntryOptions</code>.

### Factory context

| <code>FactoryCtx&lt;T&gt;</code> member | Meaning and current boundary |
| --- | --- |
| <code>signal</code> | A fresh <code>AbortSignal</code>. The kernel does not yet abort it on a cache deadline. |
| <code>graced</code> | Optional <code>GracedInfo</code> describing a stale candidate. It is not populated today. |
| <code>request</code> | The adapter request object. Under <code>dev: true</code> and explicit public scope, property reads can demote the fill to L1-only. |
| <code>fail(err?)</code> | Throws a factory failure without pretending it is a returned <code>T</code>. |
| <code>dependsOn(tag, options?)</code> | Declared factory-time dependency contribution; currently a no-op. |
| <code>setTags(tags)</code> | Declared factory-time replacement of tags; currently a no-op. |
| <code>setTtl(ttl)</code> | Declared factory-time TTL override; currently a no-op. |
| <code>reuseGraced()</code> | Intended typed reuse of the graced value after provenance checks; currently throws <code>NotImplementedError</code>. |

<code>EntryFactoryCtx&lt;T&gt;</code> adds <code>skip(): never</code>. Calling it produces a skipped entry and stores nothing. The plain <code>FactoryCtx&lt;T&gt;</code> deliberately has no <code>skip()</code>.

Related exports are <code>FactoryCtx</code>, <code>EntryFactoryCtx</code>, <code>GracedInfo</code>, and <code>RequestContext</code>.

<code>GracedInfo</code> exposes the candidate's unknown-typed <code>value</code>, source identifier <code>src</code>, schema version <code>v</code>, and original <code>bornMs</code>. It is metadata for <code>reuseGraced()</code>, not permission to cast the unknown value to <code>T</code>.

### <code>CacheEntry&lt;T&gt;</code>

| Field | Meaning and current boundary |
| --- | --- |
| <code>value</code> | The value, or <code>undefined</code> for a miss, skip, or negative entry. |
| <code>skipped</code> | The entry factory called <code>skip()</code>. |
| <code>stale</code> | The returned value was not fresh at this read's consistency level. |
| <code>age</code> | Always zero while elapsed-time accounting is unfinished. |
| <code>tier</code> | <code>l1</code>, <code>l2</code>, <code>origin</code>, or <code>miss</code>. The exported <code>Tier</code> union also declares <code>l1.5</code>, which is not emitted. |
| <code>servedOnError</code> | Present when a classified transient failure reused a revalidated stale candidate. |
| <code>durable</code> | On an origin result, whether shared L2 accepted the value or a newer durable entry won. Existing hit paths currently report <code>true</code> unconditionally. |

## Invalidate values

### Selector types

<code>ExpireSelector</code> accepts <code>{ tag, scope? }</code> or <code>{ key }</code>. <code>DeleteSelector</code> accepts those shapes plus an optional <code>cdn</code> mode.

- A tag selector affects every entry carrying that tag. The current implementation ignores its optional <code>scope</code> field.
- A key selector targets the contextless public canonical key only. Use a dependency tag when tenant or principal variants may exist.
- <code>CdnMode</code> is <code>"enqueue" | "await" | "block"</code>, but no mode invokes the configured CDN today.

<code>OriginLoadGuard</code> is the explicit <code>{ iUnderstandTheOriginLoad: true }</code> acknowledgement required by the unimplemented <code>expireAll()</code> and <code>deleteAll()</code> methods.

### <code>PurgeResult</code>

| Field or method | Meaning and current boundary |
| --- | --- |
| <code>epoch</code> | Registry epoch returned for the mutation. |
| <code>matchedHint</code> | Best-effort <code>MatchedHint</code>: <code>yes</code>, <code>no-such-scope</code>, or <code>unknown</code>. It is always <code>unknown</code> today. |
| <code>flushed({ timeout? })</code> | Intended durable, Bus, and mirror-acceptance completion. Resolves immediately today. |
| <code>edgePurged({ timeout? })</code> | Intended CDN-acceptance completion. Resolves immediately without a CDN purge today. |

See [Invalidating data](/cache/tags-and-invalidation/) for safe mutation order and [API status](/cache/api-status/) before using completion fields operationally.

## Build tags and durations

### Tag exports

| Export | Purpose and current boundary |
| --- | --- |
| <code>Tag</code> | Branded string accepted by cache reads and invalidation selectors. |
| <code>TagPart</code> | <code>string &#124; number</code> input used by tag helpers. |
| <code>compound(...parts)</code> | Implemented positional tag builder with escaping and explicit arity. |
| <code>t</code> | Tagged-template builder declared for readable tags; currently throws <code>NotImplementedError</code>. |
| <code>globalTag(name)</code> | Declared globally scoped tag helper; currently throws <code>NotImplementedError</code>. |

User tags beginning with <code>__</code> are reserved and rejected with <code>InvalidTagError</code> at the cache boundary. <code>compound()</code> is the usable helper in the current source.

### Duration exports

<code>Duration</code> is a template-literal type such as <code>"250ms"</code>, <code>"5m"</code>, or <code>"1.5h"</code>. <code>DurationUnit</code> is <code>"ms" | "s" | "m" | "h" | "d"</code>; <code>m</code> means minutes.

<code>duration(value, unit)</code> is the computed-value helper, but currently throws <code>NotImplementedError</code>. Duration strings can still appear in typed options, although elapsed TTL and grace behavior is unfinished.

## Driver contracts

Most application developers should receive drivers from a runtime package. These exports exist for adapter authors, test harnesses, and advanced integrations.

### Storage

The core Store shape is:

~~~ts
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

| Export | Purpose |
| --- | --- |
| <code>Store</code> | Async <code>get()</code>, <code>set()</code>, and <code>delete()</code> contract used by L1, L2, and mirror storage. |
| <code>StoreValue</code> | Stored string value plus optional metadata. |
| <code>StoreMetadata</code> | Readonly metadata record. |
| <code>StoreWriteOptions</code> | Optional physical <code>expirationTtl</code> in seconds and metadata. |
| <code>StoreWriteError</code> | Structural write rejection with code <code>throttled</code>, <code>too_large</code>, or <code>unavailable</code>, plus retryability and optional cause. |
| <code>isStoreWriteError(value)</code> | Implemented shape-based type guard for <code>StoreWriteError</code>. |
| <code>MemoryOptions</code> | Declares <code>maxEntries</code> and <code>maxBytes</code> for the planned local Store. |
| <code>memory(options?)</code> | Planned in-process L1 Store; currently throws <code>NotImplementedError</code>. |

<code>CasOrder</code> contains <code>epoch</code> and <code>fence</code>. <code>CasRecord</code> adds an optimistic-concurrency <code>token</code>. <code>CasStore</code> declares <code>seed(key, order)</code>, <code>load(key)</code>, and <code>swap(key, expectedToken, next)</code>. It is an optional atomic compare-and-set capability for durable drivers; the current kernel does not consume it.

### Invalidation coordination

| Export | Purpose |
| --- | --- |
| <code>Registry</code> | Live checks, soft and hard mutations, and retention registration. |
| <code>RegistryAck</code> | Mutation acknowledgement containing the accepted epoch. |
| <code>TagChange</code> | One tag's optional soft and hard watermark changes. |
| <code>BusFrame</code> | A contiguous <code>fromEpoch</code> to <code>toEpoch</code> range of changes. |
| <code>BusEvent</code> | <code>frame</code>, <code>gap</code>, or <code>reset</code> event delivered to a subscriber. |
| <code>Bus</code> | Subscribes the kernel to Bus events. The kernel validates continuity. |
| <code>Subscription</code> | Handle with <code>close()</code>. |

The Registry is authoritative; the Bus is a delivery mechanism. A gap or reset suspends warm trust until recovery establishes a verified position.

The <code>Registry</code> contract exposes:

| Member | Meaning |
| --- | --- |
| <code>check(tags)</code> | Returns live <code>TagKnowledge</code> for each requested tag. |
| <code>expire(tags)</code> | Advances soft watermarks and returns a <code>RegistryAck</code>. |
| <code>delete(tags)</code> | Advances hard watermarks and returns a <code>RegistryAck</code>. |
| <code>registerRetention(retentionMs)</code> | Registers this instance's maximum retention. |

<code>RegistryAck</code> contains the accepted <code>epoch</code>. <code>TagChange</code> contains a <code>tag</code> plus optional <code>softEpoch</code> and <code>hardEpoch</code>. <code>BusFrame</code> contains <code>fromEpoch</code>, <code>toEpoch</code>, and a list of changes. <code>BusEvent</code> is one of:

- <code>{ kind: "frame", frame }</code> for a contiguous change frame;
- <code>{ kind: "gap" }</code> when delivery loss is known;
- <code>{ kind: "reset" }</code> when the transport is re-established.

### Other capabilities

| Export | Purpose and current boundary |
| --- | --- |
| <code>Clock</code> | <code>now(): number</code>, the kernel's explicit logical-time source. |
| <code>Rng</code> | <code>next(): number</code>, the kernel's explicit random source in <code>[0, 1)</code>. |
| <code>Codec</code> | Wire identity plus synchronous <code>encode()</code> and <code>decode()</code>. |
| <code>Lock</code> | Acquires a <code>LockHandle</code> for a canonical key. |
| <code>LockHandle</code> | Carries a monotone <code>fence</code> and async <code>release()</code>. |
| <code>Cdn</code> | Accepts a set of tags and a <code>CdnMode</code>. Declared but not called today. |
| <code>CdnMode</code> | CDN acceptance request: <code>enqueue</code>, <code>await</code>, or <code>block</code>. |

See [Drivers and runtime status](/cache/drivers-and-status/) for available implementations.

## Consistency and stored data

| Export | Meaning |
| --- | --- |
| <code>Consistency</code> | <code>eventual</code> or <code>strong</code>. |
| <code>Watermark</code> | Monotone <code>softEpoch</code> and <code>hardEpoch</code> for a tag. |
| <code>TagKnowledge</code> | Either known watermarks with a verified <code>throughEpoch</code>, or <code>{ known: false }</code>. |
| <code>Validity</code> | Validation result: <code>fresh</code>, <code>stale</code>, <code>dead</code>, or <code>unknown</code>. |
| <code>UnknownPolicy</code> | <code>registry-check</code>, <code>miss</code>, or the provisional <code>error</code> policy. |
| <code>Scope</code> | Explicit <code>public</code> or tenant scope. An omitted scope may derive a principal-local storage class. |
| <code>Tier</code> | Result tier: <code>l1</code>, declared <code>l1.5</code>, <code>l2</code>, <code>origin</code>, or <code>miss</code>. |

<code>Envelope&lt;T&gt;</code> is the exported schema-v3 stored entry. Most applications should not construct envelopes directly.

| Field | Meaning |
| --- | --- |
| <code>v</code> | Literal schema version <code>3</code>. |
| <code>key</code> | Canonical namespace-version, namespace, scope, and user-key string. |
| <code>val</code> | Stored value. |
| <code>bornEpoch</code> | Invalidation epoch captured at fill start. |
| <code>bornMs</code> | Fill-start time for TTL, grace, age, and retention arithmetic—not invalidation ordering. |
| <code>storedAt</code> | Observability timestamp. |
| <code>ttl</code>, <code>grace</code> | Stored timing fields. They are zero in current entries. |
| <code>tags</code> | Sorted, deduplicated user and reserved dependency tags. |
| <code>scope</code> | Resolved public, tenant, or principal storage class. |
| <code>src</code> | Source identifier. |
| <code>kind</code> | <code>EnvelopeKind</code>: <code>val</code> or negative <code>neg</code>. |
| <code>enc</code> | <code>EnvelopeEnc</code>: <code>json</code>, <code>json+gz</code>, or <code>bin</code>. |
| <code>size</code> | Stored payload size. |
| <code>codecId</code> | Wire identity checked before decoding. |
| <code>fence</code> | Optional Lock fencing token. |

## Render collection and L3

| Export | Purpose and current boundary |
| --- | --- |
| <code>RenderCollector</code> | Records dependency tags and makes an eligibility decision at header commit. |
| <code>L3Budget</code> | Optional <code>maxBytes</code> and <code>maxTags</code> limits. |
| <code>L3Emission</code> | Eligibility, emitted cache tags, and optional ineligibility reason. |
| <code>L3Ineligibility</code> | <code>late-tag</code> or <code>budget</code>. |
| <code>Explanation</code> | Intended output of <code>explain()</code>: key, tags, applied epoch and batch, and dependencies. |

The standalone collector decision exists. Cache-hit contribution, supported header integration, <code>explain()</code>, and the CDN path are incomplete.

<code>RenderCollector.dependsOn(tag, { l3? })</code> records a dependency; setting <code>l3: false</code> makes it droppable from shared-cache emission. <code>commitHeaders({ maxBytes?, maxTags? })</code> returns an <code>L3Emission</code> with <code>eligible</code>, <code>cacheTags</code>, and an optional <code>ineligibleReason</code>. <code>Explanation</code> declares <code>key</code>, <code>tags</code>, <code>appliedEpoch</code>, <code>appliedBatch</code>, and <code>dependencies</code>.

## HTTP failures and errors

### HTTP helpers

<code>httpError(response)</code> returns an <code>HttpError</code> carrying the response and status. <code>isRetriableHttp(error)</code> is the implemented default stale-on-error classifier: it accepts network <code>TypeError</code> values, cache-originated timeouts, selected transient HTTP statuses, and Cloudflare 52x/530 statuses. It does not classify caller aborts or fact-like 403, 404, and 410 responses as retriable.

### Error exports

| Export | Meaning and current boundary |
| --- | --- |
| <code>HttpError</code> | Typed non-success HTTP response with <code>status</code> and <code>response</code>. |
| <code>CacheTimeoutError</code> | Timeout carrying a <code>CacheTimeoutSource</code> of <code>cache</code> or <code>caller</code>. The kernel does not currently create cache-deadline aborts. |
| <code>FencedError</code> | A plain-value fill was fenced by a conflicting hard invalidation, leaving no value to return. |
| <code>InvalidTagError</code> | Caller supplied a malformed or reserved tag at the cache boundary. |
| <code>NotImplementedError</code> | A declared preview surface was called before implementation. |
| <code>RegistryUnavailableError</code> | Intended strong-read Registry failure. Exported but not emitted by the current path. |

## Telemetry

| Export | Meaning |
| --- | --- |
| <code>TelemetryEvent</code> | Event name in <code>type</code> plus event-specific fields. |
| <code>TelemetrySink</code> | Function receiving each emitted event. |
| <code>TelemetryConfig</code> | Sink plus optional <code>hosted</code> flag and project <code>salt</code>. |

A plain sink may receive raw identifiers. Hosted mode with a salt HMAC-pseudonymizes emitted string fields except the structural event type. Hosted mode without a salt suppresses events rather than forwarding raw strings.

## Export boundary

The root entry point exports every symbol documented above. The source workspace also exposes an internal <code>@astilba/cache/registry</code> state-machine subpath for the test harness and Cloudflare Coordinator, but the publish configuration omits it. It is not a supported application API and should not be imported from source.

For implementation gaps, inert fields, and integration availability, continue to [API status](/cache/api-status/).

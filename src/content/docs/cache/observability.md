---
title: Inspect cache behavior
description: Witness stored entries with explain() and route operational events through telemetry sinks.
---

Astilba Cache exposes two complementary observability surfaces. <code>cache.explain()</code> takes a point-in-time witness of one public key, while telemetry reports operational events as they occur. Neither surface turns uncertainty into a stronger correctness claim.

## Inspect one key

Call <code>explain(key)</code> with the same application-facing key used by <code>getOrSet()</code>:

~~~ts
const explanation = await cache.explain(`product:${productId}`)

if (!explanation.present) {
  console.log("not present", explanation.tier, explanation.reader)
} else {
  console.log({
    tier: explanation.tier,
    identity: explanation.identity,
    verdict: explanation.verdict,
    reader: explanation.reader,
  })
}
~~~

A missing, undecodable, or codec-incompatible entry is a reportable <code>{ present: false, tier: "miss" }</code> result, not an exception.

| Result field | What it witnesses |
| --- | --- |
| <code>key</code> | The application-facing key passed to <code>explain()</code>. |
| <code>tier</code> | The first decodable copy observed in L1 or L2, or <code>miss</code>. |
| <code>identity.tags</code> | The stored user and reserved tags. |
| <code>identity.scope</code> | The stored scope literal, or an explicit <code>unreadable</code> marker. |
| <code>identity.bornEpoch</code> | The invalidation epoch at which the entry was born. |
| <code>identity.ttl</code> | Stored TTL evidence. Current entries report <code>{ kind: "not-stored" }</code>. |
| <code>identity.kind</code> | A value or negative entry. |
| <code>verdict</code> | Current <code>fresh</code>, <code>stale</code>, <code>dead</code>, or <code>unknown</code> classification and the soft and hard epochs behind it. |
| <code>reader</code> | The local reader's applied epoch, suspicion state, and terminal recovery state. |

Without a coordinated invalidation reader, a present entry receives the codec-only fresh verdict and zero epochs. That says no local invalidation authority exists to classify it otherwise; it is not evidence from a Registry check.

## Understand the witness boundary

<code>explain()</code> reports what this Cache instance already knows. It deliberately does not:

- perform a live Registry check;
- trigger mirror recovery or resynchronization;
- hydrate an L2 result into L1;
- preserve a historical dependency graph;
- accept a scope argument.

The method canonicalizes the key at the default public scope. It cannot directly address tenant or principal-derived variants. Within a React Router request, <code>requestDependencies</code> can still show the dependencies the current render has recorded, including their scope evidence and any <code>l3</code> flag.

The L1 and L2 probes call each Store's ordinary <code>get()</code>. Cache performs no write while explaining, but a Store may have read behavior of its own; for example, <code>memory()</code> updates LRU recency on a successful read.

:::note[Use explain for diagnosis, not synchronization]
If the witness reports <code>suspect</code> or <code>unknown</code>, make the production read through the normal Cache API. That path applies the configured unknown policy, live checks, and bounded recovery rules. Calling <code>explain()</code> does not repair the state it describes.
:::

## Configure telemetry

Pass a sink directly for local use, or use <code>TelemetryConfig</code> when you need hosted pseudonymization or sink-failure reporting:

~~~ts
const cache = createCache({
  namespace: "storefront",
  clock,
  rng,
  l2,
  telemetry: {
    sink: (event) => logger.info(event),
    onSinkError: (error) => logger.warn({ error }, "cache telemetry failed"),
  },
})
~~~

Built-in event delivery swallows both synchronous sink throws and asynchronous sink rejections so observability code cannot fail a read, fill, or response. <code>onSinkError</code> is called for a swallowed failure; failures from that hook are swallowed too.

For a hosted sink, set <code>hosted: true</code> and provide a project <code>salt</code>. String fields other than the event type are HMAC-pseudonymized before delivery. Hosted mode without a salt suppresses the event instead of forwarding raw strings.

## Use the event catalog

<code>TELEMETRY_EVENTS</code> is the public catalog, and <code>TelemetryEventName</code> is the union of its values.

| Event | Current source behavior |
| --- | --- |
| <code>writeback_throttled</code> | A retryable throttled L2 write was suppressed and the origin result remained non-durable. |
| <code>l2_write_error</code> | Another retryable L2 write failure was suppressed. |
| <code>singleflight_option_mismatch</code> | Production mode ran incompatible same-key work separately. |
| <code>private_evicted</code> | A configured <code>memory()</code> sink observed a principal-scoped entry evicted by an LRU bound. |
| <code>poll_tick_failed</code> | React Router's request-piggyback recovery tick rejected. |
| <code>l3_ineligible</code> | React Router demoted a managed response for <code>budget</code>, <code>late_tag</code>, <code>scope</code>, or <code>scope_unreadable</code>. |
| <code>regid_divergence</code> | The Coordinator writes a Workers log when a derived Registry identity differs from its journaled identity. |
| <code>registry_degraded</code> | Reserved in the catalog; no current emit site. |
| <code>state_stale</code> | Reserved in the catalog; no current emit site. |

The catalog closes the event-name vocabulary, not every event payload. Treat fields other than <code>type</code> according to the specific event you consume.

## Wire adapter and memory events separately

The React Router middleware accepts its own <code>telemetry</code> and <code>onSinkError</code> options for <code>poll_tick_failed</code> and <code>l3_ineligible</code>. Pass the same sink explicitly if you want those events beside kernel events:

~~~ts
cacheMiddleware({ cache, telemetry: sink, onSinkError, waitUntil })
~~~

The <code>memory()</code> driver also accepts <code>telemetry</code> and <code>onSinkError</code>. It emits <code>private_evicted</code> only when memory pressure removes a <code>usr:</code>-scoped entry, with count and byte information but no key, hash, or tag. TTL expiry, explicit deletion, and replacement do not emit that event.

<code>createWorkersCache()</code> currently fixes its internal L1 construction and exposes no telemetry option. To receive <code>private_evicted</code> from a memory L1, compose <code>createCache()</code> and <code>memory({ telemetry })</code> directly. Kernel telemetry and React Router middleware telemetry likewise remain separate options in the current preview.

Continue with [Cache HTTP responses](/cache/response-caching/) for the response safety gate, [Control cache sharing](/cache/scopes-and-privacy/) for private storage rules, or [API reference](/cache/api-reference/) for the complete types.

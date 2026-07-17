---
title: Consistency and resilience
description: Choose what a read must observe and which transient failures may reuse a stale value.
---

In Astilba Cache, consistency controls what a read must observe. Resilience controls which failures may reuse a previously good value. They are related, but they are not the same switch.

The **Registry** is the authoritative invalidation record, the **Bus** delivers its updates to active instances, and **L2** is the shared Store used for values and recovery data. See [Cache fundamentals](/docs/cache/core-concepts/) for the complete vocabulary.

These consistency levels become meaningful when <code>Registry</code>, <code>Bus</code>, and <code>L2</code> are configured together. L2 holds values and the durable recovery mirror; <code>createCache()</code> refuses a Registry-plus-Bus reader without it. Without the coordinated invalidation path, the current kernel treats decoded entries as fresh and <code>consistency</code> does not create a live check.

## Choose a consistency level

| Level | Current behavior | Cost |
| --- | --- | --- |
| Eventual — default | Uses verified local invalidation knowledge. Unknown or suspect knowledge follows the configured unknown policy. | Usually no Registry round trip on a warm, known hit. Conservative misses or checks occur while knowledge reconverges. |
| Strong — opt in | Performs a live, un-memoized Registry check before serving a stored entry and before running the factory for a miss. A soft-stale value is refilled in the foreground instead of returned through the eventual stale path. | Adds authoritative coordination to stored-entry reads and fills, and surfaces Registry failures. |

Choose strong mode with <code>consistency: "strong"</code> on the call. Although <code>defaults.consistency</code> exists in the public type, the current read path does not consume it and still defaults an omitted call option to eventual.

- Unknown or suspect knowledge never validates an entry as fresh or grace-servable by itself.
- A hard invalidation observed during a fill can fence the result. When verified knowledge advanced, the kernel re-mints the birth epoch and may refetch within a three-attempt budget before surfacing <code>FencedError</code> or a miss entry.

On a strong miss, the pre-factory live check establishes the current Registry epoch from the canonical key, namespace, and caller-declared tags. Tags discovered later through <code>FactoryCtx</code> join the final stored set and write-back fence. They were not available for individual pre-checking, but a delivered hard purge on one during the fill can still fence and retry the result.

Strong mode may still use an eligible stale candidate when its foreground factory fails with a classified transient error and the call declared <code>grace</code>. It rechecks the candidate at serve time; a hard-dead or still-unknown value is not served.

## Decide what unknown means

Set <code>defaults.unknownPolicy</code> for eventual reads:

| Policy | Result |
| --- | --- |
| <code>registry-check</code> — default | Ask the Registry for live tag watermarks. If the check cannot establish safety, the read fails closed. |
| <code>miss</code> | Treat the entry as unusable and continue to the fill path. |
| <code>error</code> | Declared as an error posture, but the current read path still treats the unknown entry as a miss and continues to fill. Do not rely on an exception yet. |

<code>takedownSensitive: true</code> selects that same provisional <code>error</code> branch unless an explicit policy overrides it; it does not yet produce a takedown-safe exception. The typed <code>defaults.onUnavailable</code> option is also not implemented. A failed strong Registry call currently propagates the driver's error rather than degrading to eventual or being wrapped as <code>RegistryUnavailableError</code>.

The source Workers factory explicitly chooses <code>registry-check</code>. Its request-piggyback poller helps future eventual reads reconverge, but it never turns unverified knowledge into a current-read hit; a read that is still suspect follows the fail-closed policy immediately.

## Serve stale data only for classified failures

A failed factory does not modify a stored good value. A transient failure may reuse a stale candidate only after the candidate is revalidated at serve time.

~~~ts title="loader.ts"
import { httpError } from "@astilba/cache"

export async function loadProduct(url: URL) {
  const response = await fetch(url)

  if (!response.ok) {
    throw httpError(response)
  }

  return response.json()
}
~~~

The default <code>isRetriableHttp()</code> classifier accepts:

- any <code>TypeError</code>, intended to cover fetch and network rejections;
- cache-originated <code>CacheTimeoutError</code> values;
- HTTP 408, 425, 429, 500, 502, 503, and 504;
- Cloudflare 520–527 and 530 responses.

Caller-originated timeouts and fact-like HTTP responses such as 403, 404, and 410 are not retriable by default. Replace the classifier with <code>defaults.staleIfError</code> when your application has a different failure vocabulary.

## Keep facts visible

Negative entries are never served through grace or stale-on-error. Declaring <code>notFoundTtl</code> opts an <code>HttpError</code> with status 404 into a negative write, and a negative result cannot displace a still-servable value.

:::caution[Durations are not enforced]
The presence of <code>grace</code> currently opts a stale candidate into error fallback, but elapsed grace is not measured. Likewise, <code>notFoundTtl</code> opts into a negative entry without expiring it after the declared duration. Full TTL, grace, and age behavior is unfinished.
:::

An eventual soft-stale read also awaits its refresh in the current implementation, then returns the stale value. Background adoption, queue retry, and refresh completion tracking are not yet present.

Use <code>cache.explain(key)</code> to inspect the current local verdict and reader state without changing it. The method performs no live Registry check or resynchronization, so it is useful for diagnosis but never a substitute for a strong read. See [Inspect cache behavior](/docs/cache/observability/).

## Related

- [How Cache works](/docs/cache/how-it-works/) explains the invalidation knowledge behind these read decisions.
- [Cache fundamentals](/docs/cache/core-concepts/) defines Registry, Bus, consistency, and grace in plain language.
- [Read and cache values](/docs/cache/reading-and-filling/) follows the foreground fill and stale return shapes.
- [Inspect cache behavior](/docs/cache/observability/) explains the point-in-time verdict and reader witness.
- [Implementation status](/docs/cache/api-status/) records unfinished timing and unavailable-policy behavior.

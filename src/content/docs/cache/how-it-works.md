---
title: How Cache works
description: Follow one value through storage, invalidation, recovery, and a safe refill.
---

Astilba Cache separates the path that stores values from the path that decides whether those values are still legal to serve. If L1, L2, Registry, or Bus are unfamiliar, read [Core concepts](/cache/core-concepts/) first.

| Plane | Components | Responsibility |
| --- | --- | --- |
| Value path | Cache kernel, local L1 Store, shared L2 Store, factory, Codec | Find, validate, fill, and store a value. |
| Invalidation path | authoritative Registry, delivery Bus, L2 mirror, replication reader | Mint invalidation order and distribute tag watermarks to every active instance. |

The separation is deliberate. A fast storage hit is useful only if the reader can also establish that the entry has not been invalidated.

## Follow one read

1. **Resolve a canonical key.** Cache combines the namespace version, resolved scope, and user key. Public, tenant, and principal-derived values therefore occupy different storage keys.
2. **Read L1, then L2.** L1 is an optional isolate-local <code>Store</code>. L2 is the shared or durable <code>Store</code> and is currently required whenever a factory must run.
3. **Check the codec before decoding.** Stored metadata carries a codec identity. A foreign or unsupported identity becomes a miss before its bytes reach the decoder.
4. **Validate invalidation knowledge.** With coordinated invalidation configured, the entry's birth epoch is compared with the soft and hard watermarks for all of its tags.
5. **Serve or fill.** A fresh entry is returned. A soft-stale eventual entry follows the refresh path. A dead or unknown entry is not served directly, so the factory runs or an error is surfaced. A strong coordinated miss performs an authoritative check before the factory starts.
6. **Fence the result.** Before write-back, Cache checks whether a hard purge landed during the fill. If verified knowledge advanced, it can re-mint the birth epoch and refetch within a bounded three-attempt budget instead of publishing a born-dead value.
7. **Write by scope.** Shared public and tenant entries may reach L2. Principal-derived entries are L1-only. A successful fill also hydrates L1 when one is configured.

Compatible foreground fills share one in-isolate promise. Cross-isolate exclusion is separate and opt-in through a <code>Lock</code> driver.

## How invalidation travels

The Registry is the authority. It keeps a monotone epoch and two watermarks per tag:

- a **soft watermark** makes older values stale;
- a **hard watermark** makes older values unreadable.

The Bus is the warm path. It carries ordered frames to active isolates. A reset, declared gap, or non-contiguous frame marks local knowledge suspect.

The L2 replication mirror stores one mutable pointer plus immutable delta batches and snapshots. A suspect reader first tries a bounded contiguous delta replay. If a persistent hole spends that retry budget, it can load the exact snapshot named by the pointer and then replay the tail above it. Missing, corrupt, foreign, or otherwise unfillable recovery data keeps the reader fail closed after both bounded recovery paths are exhausted.

Recovery has two triggers:

- a suspect read performs one bounded fast resync attempt before classifying the entry;
- an attached replication poller observes pointer liveness and drives bounded retry and snapshot escalation outside the read path.

The React Router adapter supplies request-piggyback poll ticks. An idle isolate receives no ticks, but it also serves no reads; the next request observes the elapsed state and starts a tick. A different runtime embedding must provide its own tick driver or rely on reactive read-path recovery.

## What “unknown” means

Tag knowledge is effectively tri-state:

- **known** — the reader has verified watermarks for the tag;
- **unknown** — the tag has not been verified;
- **suspect** — a transport or recovery event means the warm map cannot be trusted.

Unknown and suspect are not treated as fresh. The default eventual policy attempts a live Registry check; an application may choose a conservative miss instead. The <code>error</code> policy is present in the types but currently follows the miss path rather than throwing. When coordinated invalidation is active, a strong read uses a live, un-memoized Registry check before serving a stored entry and before filling a strong miss.

## Timing is the major unfinished layer

The invalidation ordering above is active. Elapsed-time expiry is not: TTL, grace, and <code>notFoundTtl</code> are present in the types but their durations are not enforced, and entry <code>age</code> remains zero. A stale refresh is also awaited in the current kernel instead of being adopted by a background lifecycle. Keep those limitations separate from the implemented epoch and watermark model.

## Related

- [Runtime architecture](/cache/architecture/) maps these operations to the supplied capability contracts.
- [Core concepts](/cache/core-concepts/) provides the plain-language vocabulary.
- [Invalidating data](/cache/tags-and-invalidation/) explains soft and hard mutations from the caller's side.
- [Consistency and resilience](/cache/consistency-and-resilience/) covers live checks and stale-on-error behavior.

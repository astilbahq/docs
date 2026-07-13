---
title: Overview
description: Portable TypeScript caching with explicit invalidation, stale-on-error resilience, and privacy-aware scopes.
---

Astilba Cache gives server data explicit invalidation, failure, and sharing rules without tying the correctness model to one runtime or storage vendor.

The central idea is that a cache is not only a faster place to read data. Once values are copied across isolates and storage tiers, it becomes a consistency system: the library must know when a value is still legal to serve, what to do when invalidation knowledge is incomplete, and whether a value may enter shared storage at all.

- **Guarantee:** Uncertain invalidation knowledge never becomes false freshness.
- **Trade-off:** Conservative reads may do extra origin work while systems reconverge.
- **Failure behavior:** Classified transient failures can serve a revalidated stale value.

## The five decisions in every operation

| Decision | Public control | Why it matters |
| --- | --- | --- |
| Where is the value? | <code>key</code> and <code>namespace</code> | Identifies one cached representation. |
| What does it depend on? | <code>tags</code> | Lets one source change invalidate every dependent representation. |
| Who may share it? | <code>scope</code> and request identity | Keeps principal-derived values out of shared storage by default. |
| What must this read observe? | <code>consistency</code> | Chooses verified local knowledge or a live registry check. |
| Which failures may reuse old data? | <code>grace</code> and <code>staleIfError</code> | Separates transient outages from facts such as 404 and 403 responses. |

Application code reads and invalidates through one cache instance. Typed drivers provide storage, coordination, time, and randomness; the portable kernel owns the rules above.

## What Cache owns

- **Explicit invalidation.** Soft expiration and hard deletion are separate operations with different read behavior.
- **Resilience by policy.** Fact-like failures stay visible. Transient failures can reuse a stale value only after it is checked again.
- **Scoped by identity.** Adapter-visible identity keeps user-specific values out of shared storage by default.
- **Fail-closed recovery.** A bus gap, missing mirror object, or unknown tag suspends warm trust instead of guessing.
- **Safe fill arbitration.** Compatible callers share in-isolate work, while invalidation fences values produced across a conflicting purge.

## What Cache does not own

- It does not update your database or source of truth. Change the source first, then invalidate its cached representations.
- It does not make an undeclared closure safe to share. The kernel can guard request data it can see, not arbitrary captured values.
- It does not currently provide a supported framework adapter, deployment template, CDN purge path, or production bus.
- It does not yet enforce elapsed TTL, grace, or negative-cache durations. See [API status](/cache/api-status/) for the exact preview boundary.

## Release status

| Surface | Status | Detail |
| --- | --- | --- |
| Correctness kernel | Implemented | Read, fill, scope, codec, resilience, and invalidation behavior is exercised by deterministic tests. |
| Driver contracts | Implemented | The Cloudflare KV store and Durable Object registry pass the same applicable contracts as the reference drivers. |
| Cloudflare path | Internal preview | The KV store, Coordinator, registry client, snapshots, and replication recovery run under workerd. The production bus, poll driver, and supported package exports are still missing. |
| Public package | Not released | The repository is versioned as an unreleased package and has no supported installation path. |

The internal Cloudflare modules are implementation evidence, not public entry points. Keep using the Unreleased docs until the complete runtime path is packaged and supported.

## Choose a path

- [Understand the runtime architecture](/cache/architecture/) and its capability boundaries.
- [Walk through the preview API](/cache/quickstart/) with a complete development-only store example.
- [Learn how Cache works](/cache/how-it-works/) to connect a read with invalidation and recovery.
- [Read and fill a value](/cache/reading-and-filling/) to understand the value and metadata forms.
- [Invalidate cached data](/cache/tags-and-invalidation/) to choose between soft and hard invalidation.
- [Check the API status](/cache/api-status/) before relying on a helper or metadata field.
- [Check driver status](/cache/drivers-and-status/) to see which integrations are real today.

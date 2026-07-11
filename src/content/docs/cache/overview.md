---
title: Overview
description: Portable TypeScript caching with explicit invalidation, stale-on-error resilience, and privacy-aware scopes.
---

Cache gives server data explicit freshness, invalidation, and failure behavior without tying your application to one runtime or storage vendor.

- **Guarantee:** Uncertain invalidation knowledge never becomes false freshness.
- **Trade-off:** Conservative reads may do extra origin work while systems reconverge.
- **Failure behavior:** Classified transient failures can serve a revalidated stale value.

## A conservative operating model

Application code reads and invalidates through one cache instance. Typed drivers provide storage, coordination, time, and randomness without changing the rules the kernel enforces.

## What the library owns

- **Explicit invalidation.** Soft expiration and hard deletion are separate operations with different read behavior.
- **Resilience by policy.** Fact-like failures stay visible. Transient failures can reuse a stale value only after it is checked again.
- **Scoped by identity.** Adapter-visible identity keeps user-specific values out of shared storage by default.

## Release status

| Surface | Status | Detail |
| --- | --- | --- |
| Correctness kernel | Implemented | Read, fill, scope, codec, resilience, and invalidation behavior is exercised by deterministic tests. |
| Driver contracts | Implemented | The Cloudflare KV store and Durable Object registry pass the same applicable contracts as the reference drivers. |
| Cloudflare path | Internal preview | The KV store, Coordinator, registry client, and replication path run under workerd. The production bus and supported package exports are still missing. |
| Public package | Not released | The repository is versioned as an unreleased package and has no supported installation path. |

The internal Cloudflare modules are implementation evidence, not public entry points. Keep using the Unreleased docs until the complete runtime path is packaged and supported.

## Choose a path

- [Walk through a first operation](/cache/quickstart/) to preview one read without treating the package as production-ready.
- [Read and fill a value](/cache/reading-and-filling/) to understand the value and metadata forms.
- [Invalidate cached data](/cache/tags-and-invalidation/) to choose between soft and hard invalidation.
- [Check the API status](/cache/api-status/) before relying on a helper or metadata field.
- [Check driver status](/cache/drivers-and-status/) to see which integrations are real today.

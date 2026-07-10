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
| Correctness kernel | Ready | Core behavior is covered by the deterministic invariant suite. |
| Conformance layer | Ready | Driver contracts exist and reference implementations pass them. |
| Cloudflare path | In progress | The Durable Object shell is under active development. |
| Public package | Not shipped | There is no supported install or production adapter bundle yet. |

## Choose a path

- [Walk through a first operation](/cache/quickstart/) to preview one read without treating the package as production-ready.
- [Read and fill a value](/cache/reading-and-filling/) to understand the value and metadata forms.
- [Invalidate cached data](/cache/tags-and-invalidation/) to choose between soft and hard invalidation.
- [Check driver status](/cache/drivers-and-status/) to see which integrations are real today.

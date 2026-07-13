---
title: Runtime architecture
description: See how the portable Astilba Cache kernel composes storage, coordination, time, and encoding capabilities.
---

Astilba Cache keeps its behavior in a portable kernel and receives runtime capabilities through typed contracts. The kernel owns keys, scopes, tier order, decode safety, fill coordination, and invalidation decisions. Your runtime supplies storage, coordination, time, randomness, and any custom encoding.

This is an advanced integration page. For application-level definitions and a smaller starting point, begin with [Core concepts](/cache/core-concepts/) or the [preview walkthrough](/cache/quickstart/).

## Capabilities at the boundary

| Capability | What Cache uses it for | Current requirement |
| --- | --- | --- |
| <code>Clock</code> and <code>Rng</code> | Injected time and randomness keep the kernel portable and deterministic in tests. | Required by <code>createCache()</code>; a future runtime preset should normally supply them. |
| <code>Store</code> | Key/value I/O for local L1, shared L2, and the replication mirror. | L2 is currently required whenever a factory must run. L1 is optional. |
| <code>Registry</code> | The authoritative record of soft, hard, and namespace invalidation. | Required by <code>expire()</code>, <code>delete()</code>, and <code>clear()</code>. |
| <code>Bus</code> | The live delivery path for ordered invalidation events. | Participates in coordinated read validation when Registry is also configured. L2 separately supports fills and mirror replay. |
| <code>Codec</code> | Value encoding and a wire identity checked before decode. | Optional when the built-in JSON round trip is sufficient. |
| <code>Lock</code> | Cross-isolate exclusion and write arbitration. | Optional and only used when a driver is supplied and the call opts in. |
| <code>Cdn</code> | A future edge-purge boundary. | Declared but not wired in the current kernel. |

These contracts keep the correctness rules independent of a storage vendor. They do not make every driver combination equivalent: coordinated invalidation needs a complete coordination path.

## Follow one read or fill

1. Cache resolves the namespace, scope, and user key into one canonical storage key.
2. It checks L1 before L2, verifies the stored codec identity, and reconstructs the entry.
3. When coordinated invalidation is configured, it decides whether its tag knowledge is sufficient for the requested consistency level.
4. On a miss, compatible callers share one in-isolate factory execution.
5. Before write-back, Cache checks for a conflicting hard invalidation, then writes only to tiers allowed by the resolved scope.

See [Reading and filling](/cache/reading-and-filling/) for return metadata, singleflight compatibility, codec changes, and fill failures. See [How Cache works](/cache/how-it-works/) for the invalidation and recovery path around the same operation.

## Compose the current source preview

| Configuration | Current behavior |
| --- | --- |
| <code>clock</code> + <code>rng</code> + <code>l2</code> | Reads and fills through the portable kernel without coordinated invalidation. |
| Add <code>l1</code> | Adds an isolate-local read tier and retains principal-derived, L1-only values. |
| Add <code>registry</code> | Enables the purge methods. Reads do not build the coordinated invalidation path without Bus. |
| Add <code>registry</code> + <code>bus</code> together | Enables coordinated validation and live delivery. With L2, a suspect reader can also replay durable delta batches. |
| Add <code>lock</code> | Allows opted-in calls to coordinate work across isolates. No production Lock driver is exported. |
| Add a custom <code>codec</code> | Changes the wire format and identity. Accepted older identities must still be decodable by that codec. |

Supplying Bus without Registry does not build the invalidation reader. Registry without Bus can still accept purge commands, but it is not a coordinated read configuration.

## Keep runtime integrations outside the kernel

The repository exercises Cloudflare-backed storage, coordination, and recovery internally, but those modules are not supported package entry points. There is no public deployment bundle or framework adapter yet, and the internal worker is a test host rather than an application template.

:::caution[Source preview only]
These combinations describe the current source behavior. <code>@astilba/cache</code> is not published and does not yet have a supported installation or production deployment path.
:::

## Related

- [Drivers and runtime status](/cache/drivers-and-status/) lists each contract and integration boundary.
- [Consistency and resilience](/cache/consistency-and-resilience/) explains live checks, unknown knowledge, and stale-on-error policy.
- [API status](/cache/api-status/) records incomplete and provisional surfaces.

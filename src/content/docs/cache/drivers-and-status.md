---
title: Drivers and development status
description: See which driver contracts exist, which implementations are underway, and which public helpers remain placeholders.
sidebar:
  label: Drivers and status
---

The kernel depends on small typed contracts. Production adapters can change without duplicating the cache semantics they host.

## Driver model

<code>Store</code>, <code>Registry</code>, <code>Bus</code>, <code>Lock</code>, <code>Codec</code>, and <code>Cdn</code> are public contracts. <code>Clock</code> and <code>Rng</code> keep time and randomness explicit.

~~~ts title="store.ts"
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

## Surface status

| Surface | Status | Detail |
| --- | --- | --- |
| <code>createCache</code> and read APIs | Preview | Implemented; a custom L2 is required for fills today. |
| <code>expire</code>, <code>delete</code>, and <code>clear</code> | Preview | Kernel behavior exists; production registry and bus adapters are pending. |
| Scopes, singleflight, fencing, codec checks | Ready | Implemented and covered by the invariant suite. |
| Cloudflare Coordinator | In progress | The workerd binding exists; registry behavior is under construction. |
| <code>memory</code>, <code>t</code>, <code>globalTag</code>, <code>duration</code> | Not shipped | These helpers still throw or have placeholder behavior. |
| Redis and framework adapters | Not shipped | No supported package integration exists yet. |

## Not ready to document as complete

- Official installation and production driver configuration
- <code>expireAll</code>, <code>deleteAll</code>, <code>explain</code>, and <code>reuseGraced</code>
- Full TTL, grace, refresh queue, and accurate age behavior
- CDN completion guarantees and deployed consistency measurements

## Current development focus

The current implementation work is establishing the Cloudflare Coordinator as a thin platform shell around the same pure registry state machine already exercised by deterministic tests.

---
title: Scopes and privacy
description: Keep identity-bearing values local while allowing deliberate public and tenant sharing.
---

Scope answers a storage question: may this value leave the current isolate and enter a shared tier?

## How scope resolves

1. **Declared scope wins.** Use <code>public</code> or a tenant scope when sharing is an explicit part of the cache key.
2. **Visible identity stays local.** An undeclared scope with an adapter-derived principal becomes a hashed user scope and remains in L1.
3. **No identity becomes shared.** A contextless call with no principal resolves to the public storage class.

~~~ts title="profile.ts"
const entry = await cache.getOrSetEntry({
  key: "profile",
  request: { userId },
  factory: async () => loadProfile(userId),
})

entry.durable // false — principal-derived values stay local
~~~

## Public is an enforced claim

In development mode, reading guarded request data inside an explicitly public factory demotes that fill from shared storage. The runtime can protect the identity it can see; it cannot inspect values captured invisibly in arbitrary closures.

## Tenant sharing is deliberate

A tenant-only request still contains visible identity. Use an explicit tenant scope when anonymous traffic within one tenant should share a durable value.

## Telemetry follows the same posture

Hosted telemetry pseudonymizes emitted string fields with a project salt; the event type remains structural. Raw keys and tags do not belong in a hosted event stream.

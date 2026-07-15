---
title: Scopes and privacy
description: Keep identity-bearing values local while allowing deliberate public and tenant sharing.
---

In Astilba Cache, scope answers a storage question: may this value leave the current isolate and enter a shared tier?

L1 is local to one process or worker isolate; L2 is shared or durable. The Workers factory supplies a bounded <code>memory()</code> L1 automatically. See [Core concepts](/cache/core-concepts/) for the complete storage vocabulary.

## Follow the resolution rules

| Inputs | Resolved storage class | Current behavior |
| --- | --- | --- |
| <code>scope: "public"</code> | <code>pub</code> | Eligible for shared L2, subject to the development request guard below. |
| <code>scope: { tenant }</code> | Hashed <code>ten:&lt;h&gt;</code> | Eligible for shared L2; the raw tenant identifier is not stored in the scope segment. |
| No declared scope and a visible principal | Hashed <code>usr:&lt;h&gt;</code> | L1-only and <code>durable: false</code>. |
| No declared scope and no visible principal | <code>pub</code> | Eligible for shared L2. |

The kernel derives a principal from primitive <code>request.userId</code> or <code>request.tenant</code> values, in that order. Other request fields do not affect automatic scope resolution. The React Router adapter carries the application-derived request object through <code>currentRequest()</code>; the application remains responsible for authenticating it.

~~~ts title="profile.ts"
const entry = await cache.getOrSetEntry({
  key: "profile",
  request: { userId },
  factory: async () => loadProfile(userId),
})

entry.durable // false — principal-derived values never reach shared L2
~~~

## Retain private values with L1

A principal-derived fill still needs L2 to run in the current kernel, but the result deliberately skips the L2 write. Configure an L1 <code>Store</code> if you want the private value retained for a later call on the same isolate. Without L1, the current call succeeds with <code>durable: false</code> and the next call fills again. <code>createWorkersCache()</code> includes a bounded memory L1 for this reason.

## Treat public as a claim

With <code>dev: true</code>, Cache wraps <code>ctx.request</code> for an explicitly public factory. Reading any request property demotes that fill to L1-only storage. Merely attaching a request does not demote it; the factory must read through the guarded context.

~~~ts title="public-feed.ts"
const entry = await cache.getOrSetEntry({
  key: "feed",
  request: { userId },
  scope: "public",
  factory: async (ctx) => loadFeed(ctx.request?.userId),
})

entry.durable // false in dev: the public factory read request data
~~~

This guard is a development aid, not closure analysis. It cannot see identity captured outside <code>ctx.request</code>, and production mode does not install the demoting Proxy. You remain responsible for making every explicit public or tenant cache key cover all inputs that can change the returned value.

## Make tenant sharing deliberate

A request containing only <code>tenant</code> still has visible identity, so an undeclared scope becomes principal-derived and L1-only. Declare a tenant scope when values are intentionally shared inside one tenant.

~~~ts title="tenant-settings.ts"
await cache.getOrSet({
  key: "settings",
  scope: { tenant: tenantId },
  factory: async () => loadTenantSettings(tenantId),
})
~~~

:::caution[Contextless work defaults to shared]
Queue consumers, cron jobs, and other contextless code resolve to the public storage class when no principal is visible. Declare a tenant or otherwise separate the key whenever that work caches identity-bearing data.
:::

## Telemetry follows the same posture

A plain telemetry sink receives events as emitted and may contain raw identifiers. When <code>telemetry.hosted</code> is true and a project salt is supplied, the kernel HMAC-pseudonymizes every string field except the structural event type. A hosted configuration without a salt suppresses events rather than forwarding raw strings.

## Related

- [Runtime architecture](/cache/architecture/) shows how L1 and L2 fit into a configured cache.
- [React Router](/cache/react-and-server-apps/) shows how a server adapter carries authenticated identity into the request frame.
- [Reading and filling](/cache/reading-and-filling/) explains durability metadata and tier selection.
- [Invalidating data](/cache/tags-and-invalidation/) covers the limits of key and scope-qualified selectors.

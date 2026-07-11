---
title: Consistency and resilience
description: Choose how quickly reads observe invalidation and how transient failures use stale data.
---

Consistency controls what a read must observe. Resilience controls which failures may reuse a previously good value. They are related, but they are not the same switch.

These consistency levels become active when the cache is configured with its coordinated <code>Registry</code>, <code>Bus</code>, and L2 mirror path.

## Consistency levels

| Level | Behavior |
| --- | --- |
| Eventual — default | Uses verified local invalidation knowledge. If knowledge is missing or suspect, the read checks the registry or becomes a miss. |
| Strong — opt in | Checks authoritative registry state before serving or filling. A soft-stale value is refilled in the foreground rather than returned directly through stale-while-revalidate. |

- **Unknown knowledge** never validates an entry as fresh or grace-servable.
- **Hard invalidation** observed during a fill can teach the retry a newer invalidation position. The retry budget is three attempts.
- **Strong failure** surfaces registry unavailability instead of silently trusting local state.

Strong mode may still use an eligible stale candidate when its foreground factory fails with a classified transient error. It never uses that candidate without checking it again at serve time.

## Stale on error

A failed factory does not modify a stored good value. A classified transient failure may serve a stale candidate only after the candidate is revalidated at serve time.

~~~ts title="loader.ts"
import { httpError, isRetriableHttp } from "@astilba/cache"

const response = await fetch(url)

if (!response.ok) {
  throw httpError(response)
}

isRetriableHttp(new TypeError("network unavailable")) // true
~~~

The default classifier covers network failures, cache-originated timeouts, common transient HTTP statuses, and Cloudflare origin/gateway statuses in the 520–527 range plus 530. You can replace it with <code>defaults.staleIfError</code>.

## Facts stay visible

Authentication failures, permission failures, and not-found responses are not generic outages. Negative entries are never served through grace or stale-on-error.

Set <code>notFoundTtl</code> on a call to opt into remembering a 404. A negative result cannot displace an existing value that remains eligible for resilience handling.

## Timing status

:::caution[Temporal behavior is still incomplete]
TTL and grace options exist, but their full expiry behavior is not ready. Entry <code>age</code> remains zero, duration validation is unfinished, and refreshes are not yet adopted into the planned background queue lifecycle.
:::

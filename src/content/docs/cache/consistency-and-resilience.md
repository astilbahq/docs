---
title: Consistency and resilience
description: Choose how quickly reads observe invalidation and how transient failures use stale data.
---

Consistency controls what a read must observe. Resilience controls which failures may reuse a previously good value. They are related, but they are not the same switch.

## Consistency levels

| Level | Behavior |
| --- | --- |
| Eventual — default | Uses verified local invalidation knowledge. If knowledge is missing or suspect, the read checks the registry or becomes a miss. |
| Strong — opt in | Performs an authoritative registry check so the read observes invalidations accepted before it began. |

- **Unknown knowledge** never validates an entry as fresh or grace-servable.
- **Hard invalidation** fences a matching value even when a factory is already running.
- **Strong failure** surfaces registry unavailability as a named error unless explicitly degraded.

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

## Facts stay visible

Authentication failures, permission failures, and not-found responses are not generic outages. Negative entries are never served through grace or stale-on-error.

## Timing status

:::caution[Temporal behavior is still incomplete]
The public TTL and grace types exist, but full timing enforcement and accurate entry age are not ready to document as production behavior.
:::

---
title: API status
description: Check which Cache methods and helpers work in the current unreleased build.
---

Cache is still unreleased. The portable kernel is active, but several convenient helpers and production integrations remain placeholders.

## Implemented in the kernel

| Surface | Current behavior |
| --- | --- |
| <code>createCache()</code> | Builds a cache around application-supplied drivers. |
| <code>getOrSet()</code> | Reads configured tiers or fills a value with compatible in-isolate singleflight. |
| <code>getOrSetEntry()</code> | Adds skip support and returns tier, stale, durability, and error-serve metadata. |
| <code>expire()</code>, <code>delete()</code>, <code>clear()</code> | Apply soft, hard, and namespace invalidation through a supplied registry. |
| <code>compound()</code> | Produces unambiguous positional tags, including delimiter-like and empty values. |
| <code>httpError()</code>, <code>isRetriableHttp()</code> | Preserve HTTP status information and classify default stale-if-error candidates. |
| Custom codecs and locks | Participate in decode safety, fill identity, and write arbitration. |

Scope resolution, negative caching, stale-if-error revalidation, codec identity checks, classified L2 write failures, and strong/eventual invalidation behavior are also implemented.

## Partial surfaces

| Surface | Current boundary |
| --- | --- |
| TTL, grace, and <code>age</code> | Types and options exist, but complete time-based expiry is unfinished and entry age remains zero. |
| Refresh behavior | A stale eventual read preserves the stale response and performs best-effort refresh work for a later read; background adoption and queue retry are not complete. |
| <code>collect()</code> | Can decide tag-budget and late-tag eligibility, but no supported framework adapter wires it into a request lifecycle. |
| Purge completion | <code>flushed()</code> and <code>edgePurged()</code> do not yet track real completion. |
| Cloudflare drivers | Implemented internally and tested under workerd, but not exported as supported package entry points. |

## Placeholders

The following exports or context methods are not ready to use:

- <code>memory()</code>, <code>t</code>, <code>globalTag()</code>, and <code>duration()</code>
- <code>expireAll()</code>, <code>deleteAll()</code>, and <code>explain()</code>
- <code>reuseGraced()</code>, <code>setTags()</code>, <code>setTtl()</code>, and factory <code>dependsOn()</code>

Redis, CDN, production Bus, and framework integrations are not present.

:::note[Internal version tags are not package releases]
The repository's development tags record engineering milestones. Keep using the Unreleased documentation until an installable package release exists.
:::

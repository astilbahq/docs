---
title: API walkthrough
description: Trace one Astilba Cache operation with an explicit development-only Store. This is not an installation path.
---

:::caution[Illustrative source walkthrough]
<code>@astilba/cache</code> is not published and has no supported install path. This example can run only against the current repository source. Its in-memory <code>Store</code> demonstrates the API; it is not a production driver or deployment recipe.
:::

An Astilba Cache instance needs an explicit clock and random source. A factory fill currently also needs an L2 <code>Store</code>. This walkthrough supplies the smallest useful implementation of those contracts.

## Read or fill one product

~~~ts title="cache.ts"
import { compound, createCache } from "@astilba/cache"
import type {
  Clock,
  Rng,
  Store,
  StoreValue,
  StoreWriteOptions,
} from "@astilba/cache"

class DevelopmentStore implements Store {
  readonly #values = new Map<string, StoreValue>()

  async get(key: string): Promise<StoreValue | undefined> {
    return this.#values.get(key)
  }

  async set(
    key: string,
    value: string,
    options?: StoreWriteOptions,
  ): Promise<void> {
    this.#values.set(key, {
      value,
      ...(options?.metadata === undefined
        ? {}
        : { metadata: options.metadata }),
    })
  }

  async delete(key: string): Promise<void> {
    this.#values.delete(key)
  }
}

interface Product {
  id: string
  name: string
}

const clock: Clock = { now: () => Date.now() }
const rng: Rng = { next: () => Math.random() }
const store = new DevelopmentStore()

const cache = createCache({
  namespace: "storefront",
  clock,
  rng,
  l2: store,
})

const productId = "sku-123"
let originLoads = 0

const loadProduct = async (id: string): Promise<Product> => {
  originLoads += 1
  return { id, name: "Canvas backpack" }
}

const options = {
  key: `product:${productId}`,
  tags: [compound("product", productId)],
  factory: async ({ signal }: { signal: AbortSignal }) => {
    if (signal.aborted) throw signal.reason
    return loadProduct(productId)
  },
}

const first = await cache.getOrSet(options)
const second = await cache.getOrSet(options)

console.log(first, second, originLoads) // same product, one origin load
~~~

The first call misses, runs the factory, and writes the value to the supplied store. The second call resolves the same canonical key and reads that stored value. The compound tag records a stable dependency target for later invalidation.

## What this example leaves out

- It has no L1, so all retained values live in the supplied store.
- It has no Registry or Bus, so tag and key invalidation methods are not usable.
- It deliberately omits TTL and grace because elapsed-time behavior is unfinished.
- Its Store has no durability, replication, limits, or write classification.

For coordinated invalidation, add <code>registry</code> and <code>bus</code> together with L2; do not add only one. The tested Cloudflare implementations are still internal and cannot be imported from a supported package entry point.

## Related

- [Runtime architecture](/cache/architecture/) shows where each supplied capability fits.
- [How Cache works](/cache/how-it-works/) follows the complete read, invalidation, and recovery path.
- [Reading and filling](/cache/reading-and-filling/) explains return metadata and fill behavior.

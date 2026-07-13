---
title: Preview walkthrough
description: Follow one Astilba Cache miss and hit with the smallest configuration the current source can run.
---

:::caution[Illustrative source walkthrough]
<code>@astilba/cache</code> is not published and has no supported install path. This example can run only against the current repository source. Its in-memory <code>Store</code> demonstrates the API; it is not a production driver or deployment recipe.
:::

This walkthrough caches one product. The first call loads it from the source; the second call reuses the stored result.

The current source makes the setup more explicit than a finished runtime integration should. It requires:

| Part | Meaning in this example |
| --- | --- |
| <code>cache</code> | The object application code reads through. |
| <code>DevelopmentStore</code> | A minimal key/value Store backed by a Map. It stands in for a real storage driver. |
| L2 | The Store supplied as <code>l2</code>. L2 is the shared or durable tier in the Cache model, although this Map is neither shared nor durable. |
| <code>Clock</code> | The source of time supplied to the portable kernel. |
| <code>Rng</code> | The source of randomness supplied to the portable kernel. |
| Factory | <code>loadProduct()</code>, which runs when Cache cannot reuse a stored value. |

You do not need Registry, Bus, Lock, a custom Codec, or telemetry for this read-and-reuse path.

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

Read the application-facing part from <code>const options</code> downward: choose a key, optionally attach dependency tags, and provide the factory. Everything above it is preview-only runtime wiring that a supported adapter should eventually hide.

## What this example leaves out

- It has no L1, so all retained values live in the supplied store.
- It has no Registry or Bus, so tag and key invalidation methods are not usable.
- It deliberately omits TTL and grace because elapsed-time behavior is unfinished.
- Its Store has no durability, replication, limits, or write classification.

For coordinated invalidation, add <code>registry</code> and <code>bus</code> together; do not add only one. Keep L2 for factory fills and durable delta replay. The tested Cloudflare implementations are still internal and cannot be imported from a supported package entry point.

:::note[Why the setup is this long]
There is no working public <code>memory()</code> helper or supported runtime preset yet. This is the smallest honest source example, not the intended final developer experience.
:::

## Related

- [Core concepts](/cache/core-concepts/) explains every term used in the setup.
- [How Cache works](/cache/how-it-works/) follows the complete read, invalidation, and recovery path.
- [Reading and filling](/cache/reading-and-filling/) explains return metadata and fill behavior.
- [API status](/cache/api-status/) records why this is still a preview.

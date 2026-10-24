import { describe, expect, it } from 'vitest'
import { Effect, Layer, Schema } from 'effect'

import { createGameModule } from '@math-games/core'
import { HeaderService, KvCacheService } from '@math-games/effect-infra'
import type { KvCacheShape } from '@math-games/effect-infra'

import { createGetCatalogEffect } from './server-handlers'

function demoModule(levelIds: string[]) {
  return createGameModule({
    id: 'demo',
    route: '/games/demo',
    title: 'Demo',
    description: 'Demo',
    difficulties: ['easy'],
    achievements: [],
    translations: { en: {}, vi: {} },
    completionSchema: Schema.Unknown,
    computeScore: () => 0,
    catalog: levelIds.map((id) => ({ id, difficulty: 'easy' })),
  })
}

function servicesLayer() {
  const store = new Map<string, unknown>()
  const puts: string[] = []
  const kv: KvCacheShape = {
    get: <T>(key: string) =>
      Effect.sync(() => (store.has(key) ? (store.get(key) as T) : null)),
    put: <T>(key: string, value: T, _ttlSeconds: number) =>
      Effect.sync(() => {
        puts.push(key)
        store.set(key, value)
      }),
    delete: (key: string) =>
      Effect.sync(() => {
        store.delete(key)
      }),
  }
  const layer = Layer.mergeAll(
    Layer.succeed(KvCacheService, kv),
    Layer.succeed(HeaderService, {
      getRequest: () => Effect.succeed(null),
      setResponse: () => Effect.void,
      currentRequest: () => Effect.succeed({}),
    }),
  )
  return { layer, puts }
}

const levelIds = (catalog: { configs: readonly { id: string }[] }) =>
  catalog.configs.map((config) => config.id)

describe('createGetCatalogEffect', () => {
  it('does not serve a warm cache entry written for a different level set', async () => {
    const { layer } = servicesLayer()
    const beforeDeploy = demoModule(['hard_2', 'hard_3'])
    const afterDeploy = demoModule(['hard_v2_1', 'hard_v2_2'])

    await Effect.runPromise(
      createGetCatalogEffect(beforeDeploy).pipe(Effect.provide(layer)),
    )
    const catalog = await Effect.runPromise(
      createGetCatalogEffect(afterDeploy).pipe(Effect.provide(layer)),
    )

    expect(levelIds(catalog)).toEqual(['hard_v2_1', 'hard_v2_2'])
  })

  it('serves its own catalog from the cache after the first load', async () => {
    const { layer, puts } = servicesLayer()
    const module = demoModule(['easy_1', 'easy_2'])

    const first = await Effect.runPromise(
      createGetCatalogEffect(module).pipe(Effect.provide(layer)),
    )
    const second = await Effect.runPromise(
      createGetCatalogEffect(module).pipe(Effect.provide(layer)),
    )

    expect(second).toEqual(first)
    expect(puts).toHaveLength(1)
  })
})

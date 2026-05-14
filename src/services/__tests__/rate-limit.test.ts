import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  ClockService,
  RateLimitError,
  RateLimitService,
  RateLimitServiceLive,
} from '@/services'

function runLimit(key: string, now: number) {
  const clockLayer = Layer.succeed(ClockService, {
    now: () => Effect.succeed(new Date(now)),
    dateKey: () => Effect.succeed(new Date(now).toISOString().slice(0, 10)),
  })

  return Effect.runPromise(
    Effect.gen(function* () {
      yield* (yield* RateLimitService).assert(key)
    }).pipe(
      Effect.provide(RateLimitServiceLive.pipe(Layer.provide(clockLayer))),
    ),
  )
}

describe('RateLimitService', () => {
  it('allows the first call for a key', async () => {
    await expect(
      runLimit('service-first-call', 1_000_000),
    ).resolves.toBeUndefined()
  })

  it('rejects rapid duplicate calls within the 250ms window', async () => {
    const key = 'service-rapid'
    await runLimit(key, 1_000_000)

    await expect(runLimit(key, 1_000_100)).rejects.toBeInstanceOf(
      RateLimitError,
    )
  })

  it('allows calls after the 250ms window expires', async () => {
    const key = 'service-expired'
    await runLimit(key, 2_000_000)

    await expect(runLimit(key, 2_000_251)).resolves.toBeUndefined()
  })

  it('allows exactly at the 250ms boundary', async () => {
    const key = 'service-boundary'
    await runLimit(key, 3_000_000)

    await expect(runLimit(key, 3_000_250)).resolves.toBeUndefined()
  })

  it('tracks different keys independently', async () => {
    await runLimit('service-key-a', 4_000_000)
    await runLimit('service-key-b', 4_000_000)

    await expect(runLimit('service-key-a', 4_000_100)).rejects.toBeInstanceOf(
      RateLimitError,
    )
    await expect(runLimit('service-key-b', 4_000_100)).rejects.toBeInstanceOf(
      RateLimitError,
    )
    await expect(runLimit('service-key-c', 4_000_100)).resolves.toBeUndefined()
  })

  it('updates the timestamp on each successful call', async () => {
    const key = 'service-update'
    await runLimit(key, 5_000_000)
    await runLimit(key, 5_000_251)

    await expect(runLimit(key, 5_000_400)).rejects.toBeInstanceOf(
      RateLimitError,
    )
    await expect(runLimit(key, 5_000_502)).resolves.toBeUndefined()
  })
})

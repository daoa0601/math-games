import { Context, Effect, Layer } from 'effect'

import { ClockService } from './clock'
import { RateLimitError } from './errors'

const WINDOW_MS = 250
const RETENTION_MS = 60_000
const MAX_ENTRIES = 1024

const lastWriteAt = new Map<string, number>()

export interface RateLimitShape {
  readonly assert: (key: string) => Effect.Effect<void, RateLimitError>
}

export const RateLimitService =
  Context.Service<RateLimitShape>('RateLimitService')

export const RateLimitServiceLive = Layer.effect(
  RateLimitService,
  Effect.map(ClockService, (clock) => ({
    assert: (key: string) =>
      Effect.gen(function* () {
        const date = yield* clock.now()
        const now = date.getTime()
        const previous = lastWriteAt.get(key)

        if (previous !== undefined && now - previous < WINDOW_MS) {
          return yield* new RateLimitError({ key })
        }

        lastWriteAt.set(key, now)

        if (lastWriteAt.size > MAX_ENTRIES) {
          const cutoff = now - RETENTION_MS
          for (const [k, t] of lastWriteAt) {
            if (t < cutoff) lastWriteAt.delete(k)
          }
        }
      }),
  })),
)

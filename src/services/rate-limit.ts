import { Context, Effect, Layer, SynchronizedRef } from 'effect'

import { ClockService } from './clock'
import { RateLimitError } from './errors'

const WINDOW_MS = 250
const RETENTION_MS = 60_000
const MAX_ENTRIES = 1024

type RateLimitState = ReadonlyMap<string, number>

export interface RateLimitShape {
  readonly assert: (key: string) => Effect.Effect<void, RateLimitError>
}

export const RateLimitService =
  Context.Service<RateLimitShape>('RateLimitService')

export const RateLimitServiceLive = Layer.effect(
  RateLimitService,
  Effect.gen(function* () {
    const clock = yield* ClockService
    const lastWriteAt = yield* SynchronizedRef.make<RateLimitState>(new Map())

    return {
      assert: (key: string) =>
        Effect.gen(function* () {
          const date = yield* clock.now()
          const now = date.getTime()

          const blocked = yield* SynchronizedRef.modify(
            lastWriteAt,
            (entries) => {
              const previous = entries.get(key)

              if (previous !== undefined && now - previous < WINDOW_MS) {
                return [true, entries] as const
              }

              const next = new Map(entries)
              next.set(key, now)

              if (next.size > MAX_ENTRIES) {
                const cutoff = now - RETENTION_MS

                for (const [k, t] of next) {
                  if (t < cutoff) next.delete(k)
                }
              }

              return [false, next] as const
            },
          )

          if (blocked) return yield* new RateLimitError({ key })
        }),
    }
  }),
)

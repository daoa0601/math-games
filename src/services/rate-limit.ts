import { Context, Effect, Layer } from 'effect'

import { assertNotRateLimited as assertNotRateLimitedImpl } from '@/server/rate-limit'
import { RateLimitError } from './errors'

export interface RateLimitShape {
  readonly assert: (key: string) => Effect.Effect<void, RateLimitError>
}

export const RateLimitService =
  Context.Service<RateLimitShape>('RateLimitService')

export const RateLimitServiceLive = Layer.succeed(RateLimitService, {
  assert: (key: string) =>
    Effect.try({
      try: () => assertNotRateLimitedImpl(key),
      catch: () => new RateLimitError({ key }),
    }),
})

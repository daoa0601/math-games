import { Context, Effect, Layer } from 'effect'

import { assertSameOriginPost as assertSameOriginPostImpl } from '@/server/origin-guard'
import { CrossOriginError } from './errors'

export interface OriginGuardShape {
  readonly assert: () => Effect.Effect<void, CrossOriginError>
}

export const OriginGuardService =
  Context.Service<OriginGuardShape>('OriginGuardService')

export const OriginGuardServiceLive = Layer.succeed(OriginGuardService, {
  assert: () =>
    Effect.try({
      try: () => assertSameOriginPostImpl(),
      catch: (e) =>
        new CrossOriginError({
          reason: e instanceof Error ? e.message : 'Cross-origin request rejected',
        }),
    }),
})

import { Context, Effect, Layer } from 'effect'

import { CrossOriginError } from './errors'
import { HeaderService } from './headers'

export interface OriginGuardShape {
  readonly assert: () => Effect.Effect<void, CrossOriginError>
}

export const OriginGuardService =
  Context.Service<OriginGuardShape>('OriginGuardService')

export const OriginGuardServiceLive = Layer.effect(
  OriginGuardService,
  Effect.map(HeaderService, (headers) => ({
    assert: () =>
      Effect.gen(function* () {
        const fetchSite = yield* headers.getRequest('sec-fetch-site')

        if (fetchSite === 'same-origin' || fetchSite === 'same-site') return

        if (fetchSite === 'cross-site' || fetchSite === 'cross-origin') {
          return yield* new CrossOriginError({
            reason: `Cross-origin request rejected (Sec-Fetch-Site: ${fetchSite})`,
          })
        }

        const origin = yield* headers.getRequest('origin')
        const host = yield* headers.getRequest('host')

        if (!origin || !host) {
          return yield* new CrossOriginError({
            reason:
              'Cross-origin: missing Origin or Host header on state-mutating request',
          })
        }

        const parsedOrigin = yield* Effect.try({
          try: () => new URL(origin),
          catch: () =>
            new CrossOriginError({
              reason: 'Cross-origin: malformed Origin header',
            }),
        })

        if (parsedOrigin.host !== host) {
          return yield* new CrossOriginError({
            reason: `Cross-origin: Origin ${parsedOrigin.host} does not match Host ${host}`,
          })
        }
      }),
  })),
)

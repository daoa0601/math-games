import { Context, Effect, Layer } from 'effect'

import {
  createPlayerIdentity,
  createPlayerId,
  parsePlayerIdCookie,
  serializePlayerIdCookie,
} from '@/player/identity.server'
import type { PlayerIdentity } from '@/player/identity.server'

import { HeaderService } from './headers'
import { RandomService } from './random'

export interface PlayerIdentityShape {
  readonly resolve: () => Effect.Effect<PlayerIdentity>
  readonly resolveId: () => Effect.Effect<string>
}

export const PlayerIdentityService =
  Context.Service<PlayerIdentityShape>('PlayerIdentityService')

export const PlayerIdentityServiceLive = Layer.effect(
  PlayerIdentityService,
  Effect.gen(function* () {
    const headers = yield* HeaderService
    const random = yield* RandomService

    const resolve = () =>
      Effect.gen(function* () {
        const cookieHeader = yield* headers.getRequest('cookie')
        const existingId = parsePlayerIdCookie(cookieHeader)

        if (existingId) return createPlayerIdentity(existingId)

        const uuid = yield* random.uuid()
        const playerId = createPlayerId(() => uuid)
        const host = yield* headers.getRequest('host')
        yield* headers.setResponse(
          'set-cookie',
          serializePlayerIdCookie(playerId, host ?? undefined),
        )

        return createPlayerIdentity(playerId)
      })

    return {
      resolve,
      resolveId: () => Effect.map(resolve(), (identity) => identity.id),
    }
  }),
)

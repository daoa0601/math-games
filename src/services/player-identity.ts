import { Context, Layer } from 'effect'

import {
  getCurrentPlayerId,
  getCurrentPlayerIdentity,
} from '@/player/identity.server'
import type { PlayerIdentity } from '@/player/identity.server'

export interface PlayerIdentityShape {
  readonly getCurrentId: () => string
  readonly getCurrent: () => PlayerIdentity
}

export const PlayerIdentityService =
  Context.Service<PlayerIdentityShape>('PlayerIdentityService')

export const PlayerIdentityServiceLive = Layer.succeed(
  PlayerIdentityService,
  {
    getCurrentId: () => getCurrentPlayerId(),
    getCurrent: () => getCurrentPlayerIdentity(),
  },
)

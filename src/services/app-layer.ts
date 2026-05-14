import { Layer } from 'effect'

import { DbServiceLive } from './db'
import { OriginGuardServiceLive } from './origin-guard'
import { PlayerIdentityServiceLive } from './player-identity'
import { RateLimitServiceLive } from './rate-limit'

export const AppLayer = Layer.mergeAll(
  DbServiceLive,
  PlayerIdentityServiceLive,
  RateLimitServiceLive,
  OriginGuardServiceLive,
)

import { Layer } from 'effect'

import { ClockServiceLive } from './clock'
import { DbServiceLive } from './db'
import { HeaderServiceLive } from './headers'
import { OriginGuardServiceLive } from './origin-guard'
import { PlayerIdentityServiceLive } from './player-identity'
import { RandomServiceLive } from './random'
import { RateLimitServiceLive } from './rate-limit'
import { WorkerEnvServiceLive } from './worker-env'

const InfraLayer = Layer.mergeAll(
  WorkerEnvServiceLive,
  ClockServiceLive,
  RandomServiceLive,
  HeaderServiceLive,
)

const ServiceLayer = Layer.mergeAll(
  DbServiceLive,
  PlayerIdentityServiceLive,
  RateLimitServiceLive,
  OriginGuardServiceLive,
).pipe(Layer.provide(InfraLayer))

export const AppLayer = Layer.mergeAll(ServiceLayer, InfraLayer)

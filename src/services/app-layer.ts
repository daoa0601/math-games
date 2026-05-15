import { Layer } from 'effect'

import { AnalyticsServiceLive } from './analytics'
import { ClockServiceLive } from './clock'
import { DbServiceLive } from './db'
import { HeaderServiceLive } from './headers'
import { KvCacheServiceLive } from './kv-cache'
import { OriginGuardServiceLive } from './origin-guard'
import { PlayerIdentityServiceLive } from './player-identity'
import { RandomServiceLive } from './random'
import { RateLimitServiceLive } from './rate-limit'
import { TurnstileServiceLive } from './turnstile'
import { WorkerEnvServiceLive } from './worker-env'

const InfraLayer = Layer.mergeAll(
  WorkerEnvServiceLive,
  ClockServiceLive,
  RandomServiceLive,
  HeaderServiceLive,
)

const CacheLayer = KvCacheServiceLive.pipe(Layer.provide(InfraLayer))

const ServiceLayer = Layer.mergeAll(
  DbServiceLive,
  PlayerIdentityServiceLive,
  RateLimitServiceLive,
  OriginGuardServiceLive,
  AnalyticsServiceLive,
  TurnstileServiceLive,
).pipe(Layer.provide(Layer.mergeAll(InfraLayer, CacheLayer)))

export const AppLayer = Layer.mergeAll(ServiceLayer, CacheLayer, InfraLayer)

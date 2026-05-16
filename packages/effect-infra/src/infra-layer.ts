import { Layer } from 'effect'

import { ClockServiceLive } from './clock'
import { HeaderServiceLive } from './headers'
import { KvCacheServiceLive } from './kv-cache'
import { OriginGuardServiceLive } from './origin-guard'
import { RandomServiceLive } from './random'
import { RateLimitServiceLive } from './rate-limit'
import { TurnstileServiceLive } from './turnstile'
import { WorkerEnvServiceLive } from './worker-env'

const BaseLayer = Layer.mergeAll(
  WorkerEnvServiceLive,
  ClockServiceLive,
  RandomServiceLive,
  HeaderServiceLive,
)

const CacheLayer = KvCacheServiceLive.pipe(Layer.provide(BaseLayer))

const GuardLayer = Layer.mergeAll(
  OriginGuardServiceLive,
  RateLimitServiceLive,
  TurnstileServiceLive,
).pipe(Layer.provide(Layer.mergeAll(BaseLayer, CacheLayer)))

export const InfraLayer = Layer.mergeAll(GuardLayer, CacheLayer, BaseLayer)

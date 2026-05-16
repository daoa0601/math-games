import { Layer } from 'effect'

import { AccountLinkServiceLive } from './account-link'
import { AnalyticsDashboardServiceLive } from './analytics-dashboard'
import { AnalyticsServiceLive } from './analytics'
import { AssignmentServiceLive } from './assignment'
import { ClassroomServiceLive } from './classroom'
import { LeaderboardServiceLive } from './leaderboard'
import { DailyStreakServiceLive } from './daily-streak'
import { GameAttemptsServiceLive } from './game-attempts'
import { ClockServiceLive } from './clock'
import { DbServiceLive } from './db'
import { HeaderServiceLive } from './headers'
import { KvCacheServiceLive } from './kv-cache'
import { OriginGuardServiceLive } from './origin-guard'
import { PlayerIdentityServiceLive } from './player-identity'
import { RandomServiceLive } from './random'
import { RankServiceLive } from './rank'
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

const DataLayer = Layer.mergeAll(
  DbServiceLive,
  PlayerIdentityServiceLive,
).pipe(Layer.provide(Layer.mergeAll(InfraLayer, CacheLayer)))

const ServiceLayer = Layer.mergeAll(
  RankServiceLive,
  RateLimitServiceLive,
  OriginGuardServiceLive,
  AnalyticsServiceLive,
  TurnstileServiceLive,
  DailyStreakServiceLive,
  GameAttemptsServiceLive,
  ClassroomServiceLive,
  AssignmentServiceLive,
  AccountLinkServiceLive,
  LeaderboardServiceLive,
  AnalyticsDashboardServiceLive,
).pipe(Layer.provide(Layer.mergeAll(InfraLayer, CacheLayer, DataLayer)))

export const AppLayer = Layer.mergeAll(
  ServiceLayer,
  DataLayer,
  CacheLayer,
  InfraLayer,
)

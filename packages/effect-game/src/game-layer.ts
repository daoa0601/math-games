import { Layer } from 'effect'

import { AnalyticsServiceLive } from './analytics'
import { DailyStreakServiceLive } from './daily-streak'
import { DbServiceLive } from './db'
import { GameAttemptsServiceLive } from './game-attempts'
import { LeaderboardServiceLive } from './leaderboard'
import { PlayerIdentityServiceLive } from './player-identity'
import { RankServiceLive } from './rank'

const DataLayer = Layer.mergeAll(DbServiceLive, PlayerIdentityServiceLive)

const ServiceLayer = Layer.mergeAll(
  AnalyticsServiceLive,
  DailyStreakServiceLive,
  GameAttemptsServiceLive,
  LeaderboardServiceLive,
  RankServiceLive,
).pipe(Layer.provide(DataLayer))

export const GameLayer = Layer.mergeAll(ServiceLayer, DataLayer)

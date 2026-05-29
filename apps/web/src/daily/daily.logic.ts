import { dailyGameRotation, registry } from '@/games/registry'
import { Schema } from 'effect'

import {
  frontierWeightedStrategy,
  seedHash,
  type DailySelectionStrategy,
  type PerGameStat,
} from './daily.strategy'

export class DailyChallengeConfig extends Schema.Class<DailyChallengeConfig>(
  'DailyChallengeConfig',
)({
  gameId: Schema.NonEmptyString,
  levelId: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  route: Schema.NonEmptyString,
  difficulty: Schema.NonEmptyString,
}) {}

const DailyChallengeConfigJson = Schema.fromJsonString(DailyChallengeConfig)

export interface PlannedDailyChallenge extends DailyChallengeConfig {
  playerId: string
  challengeDate: string
  seed: string
  configJson: string
}

/**
 * Plan a player's daily challenge for a date. Synchronous and pure given the
 * player's per-game stats: the {@link DailySelectionStrategy} chooses the game
 * (+ difficulty hint) from their skill history, the chosen module picks a
 * concrete level, and the per-player seed makes the result reproducible.
 */
export function planDailyChallenge(
  dateKey: string,
  playerId: string,
  perGameStats: readonly PerGameStat[],
  strategy: DailySelectionStrategy = frontierWeightedStrategy,
): PlannedDailyChallenge {
  const decision = strategy.select({
    dateKey,
    playerId,
    perGameStats,
    publishedGameIds: dailyGameRotation,
    rotation: dailyGameRotation,
  })

  const module = registry[decision.gameId as keyof typeof registry]
  const seed = seedHash(`${dateKey}:${playerId}:${decision.gameId}`)
  const pick = module.getDailyPick({
    seed,
    difficulty: decision.difficultyHint,
  })

  const config: DailyChallengeConfig = {
    gameId: decision.gameId,
    levelId: pick.levelId,
    title: pick.title,
    route: module.route,
    difficulty: pick.difficulty,
  }
  const challengeSeed = `${dateKey}:${playerId}:${decision.gameId}:${pick.levelId}`

  return {
    ...config,
    playerId,
    challengeDate: dateKey,
    seed: challengeSeed,
    configJson: JSON.stringify(config),
  }
}

export function parseDailyChallengeConfig(
  configJson: string,
): DailyChallengeConfig {
  return Schema.decodeUnknownSync(DailyChallengeConfigJson)(configJson)
}

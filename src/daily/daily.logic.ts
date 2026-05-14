import type { GameId } from '@/games/game-module'
import { dailyGameRotation, registry } from '@/games/registry'

export type DailyGameId = GameId

export interface DailyChallengeConfig {
  gameId: DailyGameId
  levelId: string
  title: string
  route: string
  difficulty: string
}

export interface PlannedDailyChallenge extends DailyChallengeConfig {
  challengeDate: string
  seed: string
  configJson: string
}

function hashDate(value: string) {
  let hash = 0

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return hash
}

export function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function planDailyChallenge(dateKey: string): PlannedDailyChallenge {
  const hash = hashDate(dateKey)
  const gameId = dailyGameRotation[hash % dailyGameRotation.length]
  const module = registry[gameId]
  const pick = module.getDailyPick(hash)

  const config: DailyChallengeConfig = {
    gameId,
    levelId: pick.levelId,
    title: pick.title,
    route: module.route,
    difficulty: pick.difficulty,
  }
  const seed = `${dateKey}:${gameId}:${pick.levelId}`

  return {
    ...config,
    challengeDate: dateKey,
    seed,
    configJson: JSON.stringify(config),
  }
}

export function parseDailyChallengeConfig(
  configJson: string,
): DailyChallengeConfig {
  const parsed = JSON.parse(configJson) as DailyChallengeConfig

  return parsed
}

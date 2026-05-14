import { dailyGameRotation, registry } from '@/games/registry'
import { Schema } from 'effect'

export class DailyChallengeConfig extends Schema.Class<DailyChallengeConfig>(
  'DailyChallengeConfig',
)({
  gameId: Schema.Literals(['magic-graph', 'sequence-race', 'shape-architect']),
  levelId: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  route: Schema.Literals([
    '/games/magic-graph',
    '/games/sequence-race',
    '/games/shape-architect',
  ]),
  difficulty: Schema.NonEmptyString,
}) {}

const DailyChallengeConfigJson = Schema.fromJsonString(DailyChallengeConfig)

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
  return Schema.decodeUnknownSync(DailyChallengeConfigJson)(configJson)
}

import { dailyGameRotation, registry } from '@/games/registry'
import { Schema } from 'effect'

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
  challengeDate: string
  seed: string
  configJson: string
}

async function hashDate(value: string): Promise<number> {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return new DataView(digest).getUint32(0)
}

export async function planDailyChallenge(
  dateKey: string,
): Promise<PlannedDailyChallenge> {
  const hash = await hashDate(dateKey)
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

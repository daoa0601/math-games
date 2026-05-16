import type { GameId } from '@/games/registry'

export interface Recommendation {
  gameId: GameId
  levelId: string
  reason: string
}

export function computeRecommendations(
  _completedLevels: { gameId: string; levelId: string }[],
): Recommendation[] {
  // TODO: Restore from git — this file was lost during monorepo migration
  return []
}

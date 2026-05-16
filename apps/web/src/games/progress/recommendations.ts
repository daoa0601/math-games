import type { GameId } from '@/games/registry'
import { GAME_MODULES } from '@/games/registry'

export interface Recommendation {
  gameId: GameId
  levelId: string
  reason: string
}

const MAX_RECOMMENDATIONS = 3

export function computeRecommendations(
  completedLevels: { gameId: string; levelId: string }[],
): Recommendation[] {
  const completedSet = new Set(
    completedLevels.map((r) => `${r.gameId}:${r.levelId}`),
  )
  const completedByGame = new Map<string, Set<string>>()
  for (const row of completedLevels) {
    const set = completedByGame.get(row.gameId) ?? new Set()
    set.add(row.levelId)
    completedByGame.set(row.gameId, set)
  }

  const recommendations: Recommendation[] = []

  for (const mod of GAME_MODULES) {
    if (recommendations.length >= MAX_RECOMMENDATIONS) break

    const catalog = mod.getCatalog()
    const done = completedByGame.get(mod.id)

    if (!done) {
      recommendations.push({
        gameId: mod.id as GameId,
        levelId: catalog.initialConfigId,
        reason: `Try ${mod.title}`,
      })
      continue
    }

    const nextLevel = catalog.configs.find(
      (cfg) => !completedSet.has(`${mod.id}:${cfg.id}`),
    )

    if (nextLevel) {
      recommendations.push({
        gameId: mod.id as GameId,
        levelId: nextLevel.id,
        reason: `Continue ${mod.title} (${done.size}/${catalog.configs.length})`,
      })
    }
  }

  return recommendations
}

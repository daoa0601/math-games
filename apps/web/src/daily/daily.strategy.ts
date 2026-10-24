/**
 * Pure, deterministic selection of which game a player should practice in their
 * daily challenge. No IO / Effect / crypto — the planner stays synchronous and
 * trivially testable. The strategy is pluggable so the skill-awareness can be
 * deepened later (e.g. spaced-repetition) without touching the daily infra.
 */

export interface PerGameStat {
  gameId: string
  attempts: number
  /** 0..1 completed/attempts for this game. */
  completionRate: number
}

export interface DailySelectionInput {
  dateKey: string
  playerId: string
  perGameStats: readonly PerGameStat[]
  /** Games eligible for the daily (published rotation). */
  publishedGameIds: readonly string[]
  /** Canonical order used for deterministic tiebreaks / new-player picks. */
  rotation: readonly string[]
}

export interface DailySelectionDecision {
  gameId: string
  /** Advisory difficulty for the level pick; getDailyPick falls back if a game lacks it. */
  difficultyHint?: string
}

export interface DailySelectionStrategy {
  readonly id: string
  select(input: DailySelectionInput): DailySelectionDecision
}

/**
 * FNV-1a 32-bit hash. Deterministic and synchronous — this is a *selection*
 * seed, not security. It must stay stable forever: changing it reshuffles every
 * player's daily picks.
 */
export function seedHash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function difficultyHintFor(completionRate: number): string {
  if (completionRate < 0.34) return 'easy'
  if (completionRate < 0.67) return 'medium'
  return 'hard'
}

/**
 * Frontier-weighted: steer the player toward the game/skill they most need to
 * practice — the least-practiced or lowest-completion published game (their
 * learning edge) — with a date+player-seeded tiebreak for day-to-day variety.
 * A never-played game scores 0 (always the frontier) so coverage broadens first.
 */
export const frontierWeightedStrategy: DailySelectionStrategy = {
  id: 'frontier-weighted',
  select({ dateKey, playerId, perGameStats, publishedGameIds, rotation }) {
    const tieSeed = seedHash(`${dateKey}:${playerId}`)
    const totalAttempts = perGameStats.reduce((sum, s) => sum + s.attempts, 0)

    // New player (no usable history): deterministic, easy pick across the rotation.
    if (perGameStats.length === 0 || totalAttempts === 0) {
      const list = rotation.length > 0 ? rotation : publishedGameIds
      return { gameId: list[tieSeed % list.length], difficultyHint: 'easy' }
    }

    const statByGame = new Map(perGameStats.map((s) => [s.gameId, s]))
    const scoreFor = (gameId: string): number => {
      const s = statByGame.get(gameId)
      // Lower score = more practice owed; weight mastery over raw volume.
      return s ? s.completionRate * 100 + Math.min(s.attempts, 20) : 0
    }

    const candidates = [...publishedGameIds]
    const minScore = Math.min(...candidates.map(scoreFor))
    const frontier = candidates.filter((g) => scoreFor(g) === minScore)

    const gameId = frontier[tieSeed % frontier.length]
    const completionRate = statByGame.get(gameId)?.completionRate ?? 0
    return { gameId, difficultyHint: difficultyHintFor(completionRate) }
  },
}

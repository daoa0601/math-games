export interface Rank {
  readonly name: string
  readonly threshold: number
}

export const RANKS: readonly Rank[] = [
  { name: 'Explorer', threshold: 0 },
  { name: 'Builder', threshold: 4 },
  { name: 'Strategist', threshold: 10 },
  { name: 'Scholar', threshold: 20 },
  { name: 'Grandmaster', threshold: 35 },
]

export function computeRank(score: number): Rank {
  return (
    [...RANKS].reverse().find((rank) => score >= rank.threshold) ?? RANKS[0]
  )
}

export function computeRankScore(
  completedLevels: number,
  achievementCount: number,
): number {
  return completedLevels * 2 + achievementCount
}

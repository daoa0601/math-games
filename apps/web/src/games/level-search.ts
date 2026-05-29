export interface LevelSearch {
  level?: string
  /** When set (a challenge date), this play counts toward the daily challenge. */
  daily?: string
}

export function validateLevelSearch(
  search: Record<string, unknown>,
): LevelSearch {
  const level = search.level
  const daily = search.daily

  return {
    level: typeof level === 'string' && level.length > 0 ? level : undefined,
    daily: typeof daily === 'string' && daily.length > 0 ? daily : undefined,
  }
}

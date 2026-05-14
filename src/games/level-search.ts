export interface LevelSearch {
  level?: string
}

export function validateLevelSearch(search: Record<string, unknown>) {
  const level = search.level

  return {
    level: typeof level === 'string' && level.length > 0 ? level : undefined,
  } satisfies LevelSearch
}

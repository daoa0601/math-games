import { magicGraphModule } from '@math-games/game-magic-graph'
import { sequenceRaceModule } from '@math-games/game-sequence-race'
import { shapeArchitectModule } from '@math-games/game-shape-architect'
import { patternDetectiveModule } from '@math-games/game-pattern-detective'

export const GAME_MODULES = [
  magicGraphModule,
  sequenceRaceModule,
  shapeArchitectModule,
  patternDetectiveModule,
] as const

export type GameId = (typeof GAME_MODULES)[number]['id']
export type GameRoute = (typeof GAME_MODULES)[number]['route']

export const GAME_IDS: readonly GameId[] = GAME_MODULES.map((m) => m.id)

export const registry = Object.fromEntries(
  GAME_MODULES.map((m) => [m.id, m]),
) as { [K in GameId]: Extract<(typeof GAME_MODULES)[number], { id: K }> }

export const gameModules = Object.values(registry)

export const dailyGameRotation: readonly GameId[] = GAME_MODULES.map(
  (m) => m.id,
)

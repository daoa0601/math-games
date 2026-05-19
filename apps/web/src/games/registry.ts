import { equationBalanceModule } from '@math-games/game-equation-balance'
import { fractionBuilderModule } from '@math-games/game-fraction-builder'
import { magicGraphModule } from '@math-games/game-magic-graph'
import { sequenceRaceModule } from '@math-games/game-sequence-race'
import { shapeArchitectModule } from '@math-games/game-shape-architect'
import { patternDetectiveModule } from '@math-games/game-pattern-detective'

/** All registered game modules (including unpublished). Used for server-side routing. */
export const GAME_MODULES = [
  magicGraphModule,
  sequenceRaceModule,
  shapeArchitectModule,
  patternDetectiveModule,
  fractionBuilderModule,
  equationBalanceModule,
] as const

/** Published game modules only. Used for dashboards, daily rotation, and navigation. */
export const PUBLISHED_GAME_MODULES = GAME_MODULES.filter(
  (m) => !('published' in m && m.published === false),
)

export type GameId = (typeof GAME_MODULES)[number]['id']
export type GameRoute = (typeof GAME_MODULES)[number]['route']

export const GAME_IDS: readonly GameId[] = GAME_MODULES.map((m) => m.id)

export const registry = Object.fromEntries(
  GAME_MODULES.map((m) => [m.id, m]),
) as { [K in GameId]: Extract<(typeof GAME_MODULES)[number], { id: K }> }

export const gameModules = Object.values(registry)

export const publishedGameModules = gameModules.filter(
  (m) => !('published' in m && m.published === false),
)

export const dailyGameRotation: readonly GameId[] = PUBLISHED_GAME_MODULES.map(
  (m) => m.id,
)

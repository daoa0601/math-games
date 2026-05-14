import { magicGraphModule } from './MagicGraph/module'
import { sequenceRaceModule } from './SequenceRace/module'
import { shapeArchitectModule } from './ShapeArchitect/module'
import type { GameId } from './game-module'

export const registry = {
  'magic-graph': magicGraphModule,
  'sequence-race': sequenceRaceModule,
  'shape-architect': shapeArchitectModule,
} as const satisfies { [K in GameId]: unknown }

// Inferred union type preserves each module's precise TConfig. Consumers that
// iterate (achievements, dashboard tiles) only use cross-game-stable members
// (id, route, title, description, achievements, getCatalog, etc.).
export const gameModules = Object.values(registry)

// Order in which daily challenges rotate through games. Preserves prior
// behavior from daily.logic.ts where sequence-race led the rotation.
export const dailyGameRotation: readonly GameId[] = [
  'sequence-race',
  'magic-graph',
  'shape-architect',
]

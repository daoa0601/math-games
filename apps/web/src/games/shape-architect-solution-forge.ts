// The Shape Architect solution forge lives in the game package so it can be
// shared by the app (scheduled cron) and the infra level-forge worker without
// either depending on the other. Re-exported here for app-local imports.

export {
  buildPracticePoolSpecs,
  forgeConfigs,
  forgePracticePool,
  forgeShapeArchitectSolutions,
} from '@math-games/game-shape-architect'
export type {
  ForgeKv,
  ForgeReport,
  PracticeSpec,
} from '@math-games/game-shape-architect'

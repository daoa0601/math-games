import type { Effect, Schema } from 'effect'

import type { GameProgressValidationError } from '@/services/errors'

export type GameId = 'magic-graph' | 'sequence-race' | 'shape-architect'

export const GAME_IDS: readonly GameId[] = [
  'magic-graph',
  'sequence-race',
  'shape-architect',
]

export type GameRoute =
  | '/games/magic-graph'
  | '/games/sequence-race'
  | '/games/shape-architect'

export type AchievementCategory = 'global' | GameId
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  category: AchievementCategory
  name: string
  description: string
  rarity: AchievementRarity
}

export interface AchievementContext {
  gameId: GameId
  completed: boolean
  difficulty?: string
  streak?: number
  currentRank?: string
  isOptimalSolution?: boolean
  wasWinner?: boolean
  gamesPlayedByType?: Record<GameId, number>
}

export interface ScoreContext {
  completed: boolean
  moves: number
}

export interface GameProgressInput {
  levelId: string
  score: number
  completed: boolean
  difficulty?: string
}

export interface DailyChallengePick {
  levelId: string
  title: string
  difficulty: string
}

export interface GameCatalog<TConfig> {
  config: TConfig
  configs: TConfig[]
  initialConfigId: string
}

export interface GameModule<
  TConfig extends { id: string; difficulty: string } = {
    id: string
    difficulty: string
  },
> {
  readonly id: GameId
  readonly route: GameRoute
  readonly title: string
  readonly description: string
  readonly difficulties: readonly string[]
  readonly achievements: readonly Achievement[]
  readonly levelCount: number
  readonly getCatalog: () => GameCatalog<TConfig>
  readonly getDailyPick: (hash: number) => DailyChallengePick
  readonly computeScore: (ctx: ScoreContext) => number
  readonly evaluateAchievements: (
    ctx: AchievementContext,
    unlocked: ReadonlySet<string>,
  ) => string[]
  readonly progressExtras?: (input: GameProgressInput) => {
    isOptimalSolution?: boolean
    wasWinner?: boolean
  }
  readonly resolveLevelConfig: (levelId: string) => TConfig | null
  readonly validateGameState: (
    level: TConfig,
    rawCompletion: unknown,
  ) => { completed: boolean; moves: number } | null
  readonly completionSchema?: Schema.Schema<unknown>
  readonly validateAndComputeScore?: (
    levelId: string,
    completion: unknown,
  ) => Effect.Effect<
    {
      completed: boolean
      moves: number
      score: number
      difficulty: string
      isOptimalSolution?: boolean
      wasWinner?: boolean
    },
    GameProgressValidationError
  >
}

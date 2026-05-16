import { Effect, Schema } from 'effect'

import { GameProgressValidationError } from './errors'

export type AchievementCategory = 'global' | string
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  category: AchievementCategory
  name: string
  description: string
  rarity: AchievementRarity
}

export interface AchievementContext {
  gameId: string
  completed: boolean
  difficulty?: string
  streak?: number
  currentRank?: string
  isOptimalSolution?: boolean
  wasWinner?: boolean
  gamesPlayedByType?: Record<string, number>
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

export interface GameTranslations {
  readonly en: Readonly<Record<string, string>>
  readonly vi: Readonly<Record<string, string>>
}

export type GameFeedback =
  | { kind: 'wrong-line'; lineIndex: number; actual: number; target: number }
  | { kind: 'ai-forced-win'; finalMove: number }
  | { kind: 'collision'; pieceId: string; collidingWith: string }
  | { kind: 'out-of-bounds'; pieceId: string }
  | { kind: 'generic'; message: string }

export interface GameModule<
  TConfig extends { id: string; difficulty: string } = {
    id: string
    difficulty: string
  },
> {
  readonly id: string
  readonly route: string
  readonly title: string
  readonly description: string
  readonly difficulties: readonly string[]
  readonly achievements: readonly Achievement[]
  readonly levelCount: number
  readonly translations: GameTranslations
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
  ) => { completed: boolean; moves: number; feedback?: GameFeedback } | null
  readonly validateAndComputeScore: (
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
      feedback?: GameFeedback
    },
    GameProgressValidationError
  >
}

export function createValidateAndComputeScore<
  TConfig extends { id: string; difficulty: string },
>(parts: {
  completionSchema: Schema.Decoder<unknown>
  resolveLevelConfig: (levelId: string) => TConfig | null
  validateGameState: (
    level: TConfig,
    parsed: any,
  ) => { completed: boolean; moves: number; feedback?: GameFeedback } | null
  computeScore: (ctx: ScoreContext) => number
  progressExtras?: (input: GameProgressInput) => {
    isOptimalSolution?: boolean
    wasWinner?: boolean
  }
}): GameModule<TConfig>['validateAndComputeScore'] {
  return (levelId, raw) =>
    Effect.gen(function* () {
      const level = parts.resolveLevelConfig(levelId)
      if (!level)
        return yield* new GameProgressValidationError({
          reason: `Unknown level: ${levelId}`,
        })

      const parsed = yield* Effect.try({
        try: () => Schema.decodeUnknownSync(parts.completionSchema)(raw),
        catch: (e) =>
          new GameProgressValidationError({
            reason: e instanceof Error ? e.message : 'Invalid completion',
          }),
      })

      const validation = parts.validateGameState(level, parsed)
      if (validation === null)
        return yield* new GameProgressValidationError({
          reason: 'Invalid game state',
        })

      const score = parts.computeScore({
        completed: validation.completed,
        moves: validation.moves,
      })
      const extras = parts.progressExtras?.({
        levelId,
        score,
        completed: validation.completed,
        difficulty: level.difficulty,
      })

      return {
        completed: validation.completed,
        moves: validation.moves,
        score,
        difficulty: level.difficulty,
        feedback: validation.feedback,
        ...extras,
      }
    })
}

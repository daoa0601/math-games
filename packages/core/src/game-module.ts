import { Effect, Schema } from "effect";

import { GameProgressValidationError } from "./errors";
import type { LevelManifest } from "./level-manifest";

export type AchievementCategory = "global" | string;
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface AchievementUnlockCondition {
  completed?: boolean;
  difficulty?: string;
  isOptimalSolution?: boolean;
  wasWinner?: boolean;
  /** Unlock only when the played level exercises this skill (manifest skillTag). */
  skillTag?: string;
}

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  rarity: AchievementRarity;
  unlockWhen?: AchievementUnlockCondition;
}

export interface AchievementContext {
  gameId: string;
  completed: boolean;
  difficulty?: string;
  streak?: number;
  currentRank?: string;
  isOptimalSolution?: boolean;
  wasWinner?: boolean;
  gamesPlayedByType?: Record<string, number>;
  /** Skills the played level exercises (from its manifest), for skill-gated achievements. */
  skillTags?: readonly string[];
}

export interface ScoreContext {
  completed: boolean;
  moves: number;
}

export interface GameProgressInput {
  levelId: string;
  score: number;
  completed: boolean;
  difficulty?: string;
}

export interface DailyChallengePick {
  levelId: string;
  title: string;
  difficulty: string;
}

export interface GameCatalog<TConfig> {
  config: TConfig;
  configs: TConfig[];
  initialConfigId: string;
}

export interface GameTranslations {
  readonly en: Readonly<Record<string, string>>;
  readonly vi: Readonly<Record<string, string>>;
}

export type GameFeedback =
  | { kind: "wrong-line"; lineIndex: number; actual: number; target: number }
  | { kind: "ai-forced-win"; finalMove: number }
  | { kind: "collision"; pieceId: string; collidingWith: string }
  | { kind: "out-of-bounds"; pieceId: string }
  | { kind: "generic"; message: string };

export interface GameModule<
  TConfig extends { id: string; difficulty: string; manifest?: LevelManifest } =
    {
      id: string;
      difficulty: string;
    },
> {
  readonly id: string;
  readonly route: string;
  readonly title: string;
  readonly description: string;
  /** Set to false to hide from dashboards and daily rotation. Defaults to true. */
  readonly published?: boolean;
  readonly difficulties: readonly string[];
  readonly achievements: readonly Achievement[];
  readonly levelCount: number;
  readonly translations: GameTranslations;
  readonly getCatalog: () => GameCatalog<TConfig>;
  readonly getDailyPick: (hash: number) => DailyChallengePick;
  readonly computeScore: (ctx: ScoreContext) => number;
  readonly evaluateAchievements: (
    ctx: AchievementContext,
    unlocked: ReadonlySet<string>,
  ) => string[];
  readonly progressExtras?: (input: GameProgressInput) => {
    isOptimalSolution?: boolean;
    wasWinner?: boolean;
  };
  readonly resolveLevelConfig: (levelId: string) => TConfig | null;
  readonly validateGameState: (
    level: TConfig,
    rawCompletion: unknown,
  ) => { completed: boolean; moves: number; feedback?: GameFeedback } | null;
  readonly validateAndComputeScore: (
    levelId: string,
    completion: unknown,
  ) => Effect.Effect<
    {
      completed: boolean;
      moves: number;
      score: number;
      difficulty: string;
      isOptimalSolution?: boolean;
      wasWinner?: boolean;
      feedback?: GameFeedback;
    },
    GameProgressValidationError
  >;
}

export function createValidateAndComputeScore<
  TConfig extends { id: string; difficulty: string; manifest?: LevelManifest },
>(parts: {
  completionSchema: Schema.Decoder<unknown>;
  resolveLevelConfig: (levelId: string) => TConfig | null;
  validateGameState: (
    level: TConfig,
    parsed: any,
  ) => { completed: boolean; moves: number; feedback?: GameFeedback } | null;
  computeScore: (ctx: ScoreContext) => number;
  progressExtras?: (input: GameProgressInput) => {
    isOptimalSolution?: boolean;
    wasWinner?: boolean;
  };
}): GameModule<TConfig>["validateAndComputeScore"] {
  return (levelId, raw) =>
    Effect.gen(function* () {
      const level = parts.resolveLevelConfig(levelId);
      if (!level)
        return yield* new GameProgressValidationError({
          reason: `Unknown level: ${levelId}`,
        });

      const parsed = yield* Effect.try({
        try: () => Schema.decodeUnknownSync(parts.completionSchema)(raw),
        catch: (e) =>
          new GameProgressValidationError({
            reason: e instanceof Error ? e.message : "Invalid completion",
          }),
      });

      const validation = parts.validateGameState(level, parsed);
      if (validation === null)
        return yield* new GameProgressValidationError({
          reason: "Invalid game state",
        });

      const score = parts.computeScore({
        completed: validation.completed,
        moves: validation.moves,
      });
      const extras = parts.progressExtras?.({
        levelId,
        score,
        completed: validation.completed,
        difficulty: level.difficulty,
      });

      return {
        completed: validation.completed,
        moves: validation.moves,
        score,
        difficulty: level.difficulty,
        feedback: validation.feedback,
        ...extras,
      };
    });
}

function evaluateAchievementsByCondition(
  achievements: readonly Achievement[],
  ctx: AchievementContext,
  unlocked: ReadonlySet<string>,
): string[] {
  return achievements
    .filter((a) => {
      if (!a.unlockWhen || unlocked.has(a.id)) return false;
      const c = a.unlockWhen;
      if (c.completed !== undefined && ctx.completed !== c.completed)
        return false;
      if (c.difficulty !== undefined && ctx.difficulty !== c.difficulty)
        return false;
      if (
        c.isOptimalSolution !== undefined &&
        ctx.isOptimalSolution !== c.isOptimalSolution
      )
        return false;
      if (c.wasWinner !== undefined && ctx.wasWinner !== c.wasWinner)
        return false;
      if (c.skillTag !== undefined && !ctx.skillTags?.includes(c.skillTag))
        return false;
      return true;
    })
    .map((a) => a.id);
}

type GameValidationResult = {
  completed: boolean;
  moves: number;
  feedback?: GameFeedback;
} | null;

export interface GameModuleInput<
  TConfig extends { id: string; difficulty: string; manifest?: LevelManifest },
> {
  id: string;
  route: string;
  title: string;
  description: string;
  published?: boolean;
  difficulties: readonly string[];
  achievements: readonly Achievement[];
  translations: GameTranslations;
  completionSchema: Schema.Decoder<unknown>;
  computeScore: (ctx: ScoreContext) => number;

  catalog: readonly TConfig[];

  validate?: (level: TConfig, completion: any) => GameValidationResult;
  evaluateAchievements?: (
    ctx: AchievementContext,
    unlocked: ReadonlySet<string>,
  ) => string[];
  getCatalog?: () => GameCatalog<TConfig>;
  levelCount?: number;
  getDailyPick?: (hash: number) => DailyChallengePick;
  resolveLevelConfig?: (levelId: string) => TConfig | null;
  validateGameState?: (level: TConfig, raw: unknown) => GameValidationResult;
  progressExtras?: (input: GameProgressInput) => {
    isOptimalSolution?: boolean;
    wasWinner?: boolean;
  };
}

export function createGameModule<
  TConfig extends { id: string; difficulty: string; manifest?: LevelManifest },
  const TId extends string,
  const TRoute extends string,
>(
  input: GameModuleInput<TConfig> & { id: TId; route: TRoute },
): GameModule<TConfig> & { readonly id: TId; readonly route: TRoute } {
  const { catalog } = input;

  const getCatalog =
    input.getCatalog ??
    (() => ({
      config: catalog[0],
      configs: [...catalog],
      initialConfigId: catalog[0].id,
    }));

  const resolveLevelConfig =
    input.resolveLevelConfig ??
    ((levelId: string) => catalog.find((c) => c.id === levelId) ?? null);

  const getDailyPick =
    input.getDailyPick ??
    ((hash: number) => {
      const level = catalog[hash % catalog.length];
      return {
        levelId: level.id,
        title: level.id,
        difficulty: level.difficulty,
      };
    });

  const validateGameState =
    input.validateGameState ??
    ((level: TConfig, raw: unknown): GameValidationResult => {
      if (!input.validate) return null;
      try {
        const parsed = Schema.decodeUnknownSync(input.completionSchema)(raw);
        return input.validate(level, parsed);
      } catch {
        return null;
      }
    });

  const evaluateAchievements =
    input.evaluateAchievements ??
    ((ctx: AchievementContext, unlocked: ReadonlySet<string>) =>
      evaluateAchievementsByCondition(input.achievements, ctx, unlocked));

  const module = {
    id: input.id as TId,
    route: input.route as TRoute,
    title: input.title,
    description: input.description,
    ...(input.published !== undefined ? { published: input.published } : {}),
    difficulties: input.difficulties,
    achievements: input.achievements,
    translations: input.translations,
    levelCount: input.levelCount ?? catalog.length,
    getCatalog,
    getDailyPick,
    computeScore: input.computeScore,
    evaluateAchievements,
    ...(input.progressExtras ? { progressExtras: input.progressExtras } : {}),
    resolveLevelConfig,
    validateGameState,
    validateAndComputeScore: createValidateAndComputeScore({
      completionSchema: input.completionSchema,
      resolveLevelConfig,
      validateGameState,
      computeScore: input.computeScore,
      ...(input.progressExtras ? { progressExtras: input.progressExtras } : {}),
    }),
  };

  return module as GameModule<TConfig> & {
    readonly id: TId;
    readonly route: TRoute;
  };
}

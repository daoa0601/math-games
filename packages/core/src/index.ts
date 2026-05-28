export type {
  Achievement,
  AchievementCategory,
  AchievementContext,
  AchievementRarity,
  AchievementUnlockCondition,
  DailyChallengePick,
  GameCatalog,
  GameFeedback,
  GameModule,
  GameModuleInput,
  GameProgressInput,
  GameTranslations,
  ScoreContext,
} from "./game-module";
export { createGameModule, createValidateAndComputeScore } from "./game-module";

export { GameProgressRequest } from "./game-progress.schema";

export {
  AuthorizationError,
  ClassroomError,
  CrossOriginError,
  DailyChallengeError,
  DailyStreakError,
  GameAttemptsError,
  GameProgressValidationError,
  PlayerProfileError,
  PlayerProfileValidationError,
  PlayerProfileWriteError,
  ProgressWriteError,
  RateLimitError,
  SolverTimeoutError,
} from "./errors";

export {
  AchievementImportInput,
  DisplayName,
  GradeBand,
  Locale,
  PlayerProfileInput,
} from "./profile.schema";
export type {
  GradeBand as GradeBandType,
  Locale as LocaleType,
} from "./profile.schema";

export type { Rank } from "./ranks";
export { computeRank, computeRankScore, RANKS } from "./ranks";

export { coreTranslations } from "./i18n/core";

export type { SeededRandom } from "./utils/seeded-random";
export { createDailyRandom, createSeededRandom } from "./utils/seeded-random";

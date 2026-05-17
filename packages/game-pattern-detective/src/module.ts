import type {
  Achievement,
  AchievementContext,
  DailyChallengePick,
  GameFeedback,
  GameModule,
  ScoreContext,
} from "@math-games/core";
import { createValidateAndComputeScore } from "@math-games/core";

import { catalog, difficulties } from "./catalog";
import type { PatternConfig } from "./catalog";
import { PatternDetectiveCompletionSchema } from "./schema";
import type { PatternDetectiveCompletion } from "./schema";
import { patternDetectiveTranslations } from "./translations";
import { validate } from "./logic";
import { Schema } from "effect";

const achievements: readonly Achievement[] = [
  {
    id: "pd_first_pattern",
    category: "pattern-detective",
    name: "Pattern Spotter",
    description: "Find a missing number in a pattern.",
    rarity: "common",
  },
  {
    id: "pd_hard_streak",
    category: "pattern-detective",
    name: "Master Detective",
    description: "Solve a hard Pattern Detective puzzle.",
    rarity: "epic",
  },
];

function getCatalog() {
  return {
    config: catalog[0],
    configs: [...catalog],
    initialConfigId: catalog[0].id,
  };
}

function getDailyPick(hash: number): DailyChallengePick {
  const level = catalog[hash % catalog.length];
  return { levelId: level.id, title: level.id, difficulty: level.difficulty };
}

function resolveLevelConfig(levelId: string): PatternConfig | null {
  return catalog.find((c) => c.id === levelId) ?? null;
}

function computeScore(ctx: ScoreContext) {
  return ctx.completed ? 100 : 0;
}

function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: ReadonlySet<string>,
): string[] {
  const newly: string[] = [];
  if (ctx.completed && !unlocked.has("pd_first_pattern")) {
    newly.push("pd_first_pattern");
  }
  if (
    ctx.completed &&
    ctx.difficulty === "hard" &&
    !unlocked.has("pd_hard_streak")
  ) {
    newly.push("pd_hard_streak");
  }
  return newly;
}

function decodeCompletion(raw: unknown): PatternDetectiveCompletion | null {
  try {
    return Schema.decodeUnknownSync(PatternDetectiveCompletionSchema)(raw);
  } catch {
    return null;
  }
}

function validateGameState(
  level: PatternConfig,
  parsed: unknown,
): { completed: boolean; moves: number; feedback?: GameFeedback } | null {
  const completion = decodeCompletion(parsed);
  if (completion === null) return null;
  return validate(level, completion);
}

export const patternDetectiveModule = {
  id: "pattern-detective",
  route: "/games/pattern-detective",
  title: "Pattern Detective",
  description: "Find the missing number in the sequence.",
  difficulties,
  achievements,
  translations: patternDetectiveTranslations,
  levelCount: catalog.length,
  getCatalog,
  getDailyPick,
  computeScore,
  evaluateAchievements,
  resolveLevelConfig,
  validateGameState,
  validateAndComputeScore: createValidateAndComputeScore({
    completionSchema: PatternDetectiveCompletionSchema,
    resolveLevelConfig,
    validateGameState,
    computeScore,
  }),
} as const satisfies GameModule<PatternConfig>;

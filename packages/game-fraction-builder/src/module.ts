import type {
  Achievement,
  AchievementContext,
  DailyChallengePick,
  GameFeedback,
  GameModule,
  ScoreContext,
} from "@math-games/core";
import { createValidateAndComputeScore } from "@math-games/core";
import { Schema } from "effect";

import { catalog, difficulties } from "./catalog";
import type { FractionConfig } from "./catalog";
import { FractionBuilderCompletionSchema } from "./schema";
import type { FractionBuilderCompletion } from "./schema";
import { fractionBuilderTranslations } from "./translations";
import { validate } from "./logic";

const achievements: readonly Achievement[] = [
  {
    id: "fb_first_fraction",
    category: "fraction-builder",
    name: "First Fraction",
    description: "Complete a Fraction Builder level.",
    rarity: "common",
  },
  {
    id: "fb_simplify_master",
    category: "fraction-builder",
    name: "Simplify Master",
    description: "Simplify a fraction correctly.",
    rarity: "rare",
  },
  {
    id: "fb_compare_expert",
    category: "fraction-builder",
    name: "Comparison Expert",
    description: "Correctly compare two fractions.",
    rarity: "rare",
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

function resolveLevelConfig(levelId: string): FractionConfig | null {
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
  if (ctx.completed && !unlocked.has("fb_first_fraction")) {
    newly.push("fb_first_fraction");
  }
  return newly;
}

function decodeCompletion(raw: unknown): FractionBuilderCompletion | null {
  try {
    return Schema.decodeUnknownSync(FractionBuilderCompletionSchema)(raw);
  } catch {
    return null;
  }
}

function validateGameState(
  level: FractionConfig,
  parsed: unknown,
): { completed: boolean; moves: number; feedback?: GameFeedback } | null {
  const completion = decodeCompletion(parsed);
  if (completion === null) return null;
  return validate(level, completion);
}

export const fractionBuilderModule = {
  id: "fraction-builder",
  route: "/games/fraction-builder",
  title: "Fraction Builder",
  description: "Build, simplify, and compare fractions.",
  published: false,
  difficulties,
  achievements,
  translations: fractionBuilderTranslations,
  levelCount: catalog.length,
  getCatalog,
  getDailyPick,
  computeScore,
  evaluateAchievements,
  resolveLevelConfig,
  validateGameState,
  validateAndComputeScore: createValidateAndComputeScore({
    completionSchema: FractionBuilderCompletionSchema,
    resolveLevelConfig,
    validateGameState,
    computeScore,
  }),
} as const satisfies GameModule<FractionConfig>;

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
import type { EquationConfig } from "./catalog";
import { EquationBalanceCompletionSchema } from "./schema";
import type { EquationBalanceCompletion } from "./schema";
import { equationBalanceTranslations } from "./translations";
import { validate } from "./logic";

const achievements: readonly Achievement[] = [
  {
    id: "eb_first_equation",
    category: "equation-balance",
    name: "First Equation",
    description: "Balance an equation for the first time.",
    rarity: "common",
  },
  {
    id: "eb_hard_solver",
    category: "equation-balance",
    name: "Equation Master",
    description: "Solve a hard two-step equation.",
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

function resolveLevelConfig(levelId: string): EquationConfig | null {
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
  if (ctx.completed && !unlocked.has("eb_first_equation")) {
    newly.push("eb_first_equation");
  }
  if (
    ctx.completed &&
    ctx.difficulty === "hard" &&
    !unlocked.has("eb_hard_solver")
  ) {
    newly.push("eb_hard_solver");
  }
  return newly;
}

function decodeCompletion(raw: unknown): EquationBalanceCompletion | null {
  try {
    return Schema.decodeUnknownSync(EquationBalanceCompletionSchema)(raw);
  } catch {
    return null;
  }
}

function validateGameState(
  level: EquationConfig,
  parsed: unknown,
): { completed: boolean; moves: number; feedback?: GameFeedback } | null {
  const completion = decodeCompletion(parsed);
  if (completion === null) return null;
  return validate(level, completion);
}

export const equationBalanceModule = {
  id: "equation-balance",
  route: "/games/equation-balance",
  title: "Equation Balance",
  description: "Find the missing number that balances the equation.",
  published: false,
  difficulties,
  achievements,
  translations: equationBalanceTranslations,
  levelCount: catalog.length,
  getCatalog,
  getDailyPick,
  computeScore,
  evaluateAchievements,
  resolveLevelConfig,
  validateGameState,
  validateAndComputeScore: createValidateAndComputeScore({
    completionSchema: EquationBalanceCompletionSchema,
    resolveLevelConfig,
    validateGameState,
    computeScore,
  }),
} as const satisfies GameModule<EquationConfig>;

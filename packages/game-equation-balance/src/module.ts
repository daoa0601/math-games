import { createGameModule } from "@math-games/core";
import type { DailyChallengePick } from "@math-games/core";

import { difficulties } from "./catalog";
import type { Difficulty } from "./catalog";
import { EquationBalanceCompletionSchema } from "./schema";
import { equationBalanceTranslations } from "./translations";
import { validate } from "./logic";
import {
  getEquationBalanceCatalog,
  getEquationBalancePracticeConfig,
} from "./generator";

const practiceIdPattern = /^practice_(easy|medium|hard|expert|master)_(.+)$/;

const cachedCatalog = getEquationBalanceCatalog();

function getDailyPick(hash: number): DailyChallengePick {
  const { configs } = cachedCatalog;
  const config = configs[hash % configs.length];
  return {
    levelId: config.id,
    title: config.id,
    difficulty: config.difficulty,
  };
}

function resolveLevelConfig(levelId: string) {
  const preset = cachedCatalog.configs.find((c) => c.id === levelId);
  if (preset) return preset;

  const match = levelId.match(practiceIdPattern);
  if (!match) return null;

  return getEquationBalancePracticeConfig(match[2], match[1] as Difficulty);
}

export const equationBalanceModule = createGameModule({
  id: "equation-balance",
  route: "/games/equation-balance",
  title: "Equation Balance",
  description: "Find the missing number that balances the equation.",
  difficulties,
  catalog: cachedCatalog.configs,
  completionSchema: EquationBalanceCompletionSchema,
  translations: equationBalanceTranslations,
  getCatalog: () => cachedCatalog,
  levelCount: cachedCatalog.configs.length,
  getDailyPick,
  resolveLevelConfig,
  validate,
  computeScore: (ctx) => (ctx.completed ? 100 : 0),
  achievements: [
    {
      id: "eb_first_equation",
      category: "equation-balance",
      name: "First Equation",
      description: "Balance an equation for the first time.",
      rarity: "common",
      unlockWhen: { completed: true },
    },
    {
      id: "eb_hard_solver",
      category: "equation-balance",
      name: "Equation Master",
      description: "Solve a hard two-step equation.",
      rarity: "epic",
      unlockWhen: { completed: true, difficulty: "hard" },
    },
  ],
});

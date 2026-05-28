import { createGameModule } from "@math-games/core";

import { catalog, difficulties } from "./catalog";
import { EquationBalanceCompletionSchema } from "./schema";
import { equationBalanceTranslations } from "./translations";
import { validate } from "./logic";

export const equationBalanceModule = createGameModule({
  id: "equation-balance",
  route: "/games/equation-balance",
  title: "Equation Balance",
  description: "Find the missing number that balances the equation.",
  published: false,
  difficulties,
  catalog,
  completionSchema: EquationBalanceCompletionSchema,
  translations: equationBalanceTranslations,
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

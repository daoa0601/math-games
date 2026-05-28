import { createGameModule } from "@math-games/core";

import { catalog, difficulties } from "./catalog";
import { PatternDetectiveCompletionSchema } from "./schema";
import { patternDetectiveTranslations } from "./translations";
import { validate } from "./logic";

export const patternDetectiveModule = createGameModule({
  id: "pattern-detective",
  route: "/games/pattern-detective",
  title: "Pattern Detective",
  description: "Find the missing number in the sequence.",
  difficulties,
  catalog,
  completionSchema: PatternDetectiveCompletionSchema,
  translations: patternDetectiveTranslations,
  validate,
  computeScore: (ctx) => (ctx.completed ? 100 : 0),
  achievements: [
    {
      id: "pd_first_pattern",
      category: "pattern-detective",
      name: "Pattern Spotter",
      description: "Find a missing number in a pattern.",
      rarity: "common",
      unlockWhen: { completed: true },
    },
    {
      id: "pd_hard_streak",
      category: "pattern-detective",
      name: "Master Detective",
      description: "Solve a hard Pattern Detective puzzle.",
      rarity: "epic",
      unlockWhen: { completed: true, difficulty: "hard" },
    },
  ],
});

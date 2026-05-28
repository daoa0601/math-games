import { createGameModule } from "@math-games/core";

import { catalog, difficulties } from "./catalog";
import { FractionBuilderCompletionSchema } from "./schema";
import { fractionBuilderTranslations } from "./translations";
import { validate } from "./logic";

export const fractionBuilderModule = createGameModule({
  id: "fraction-builder",
  route: "/games/fraction-builder",
  title: "Fraction Builder",
  description: "Build, simplify, and compare fractions.",
  published: false,
  difficulties,
  catalog,
  completionSchema: FractionBuilderCompletionSchema,
  translations: fractionBuilderTranslations,
  validate,
  computeScore: (ctx) => (ctx.completed ? 100 : 0),
  achievements: [
    {
      id: "fb_first_fraction",
      category: "fraction-builder",
      name: "First Fraction",
      description: "Complete a Fraction Builder level.",
      rarity: "common",
      unlockWhen: { completed: true },
    },
    {
      id: "fb_simplify_master",
      category: "fraction-builder",
      name: "Simplify Master",
      description: "Simplify a fraction correctly.",
      rarity: "rare",
      unlockWhen: { completed: true },
    },
    {
      id: "fb_compare_expert",
      category: "fraction-builder",
      name: "Comparison Expert",
      description: "Correctly compare two fractions.",
      rarity: "rare",
      unlockWhen: { completed: true },
    },
  ],
});

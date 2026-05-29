import { createGameModule } from "@math-games/core";
import type { DailyChallengePick, DailyPickInput } from "@math-games/core";

import { difficulties } from "./catalog";
import type { Difficulty } from "./catalog";
import { FractionBuilderCompletionSchema } from "./schema";
import { fractionBuilderTranslations } from "./translations";
import { validate } from "./logic";
import {
  getFractionBuilderCatalog,
  getFractionBuilderPracticeConfig,
} from "./generator";

const practiceIdPattern = /^practice_(easy|medium|hard|expert|master)_(.+)$/;

const cachedCatalog = getFractionBuilderCatalog();

function getDailyPick({
  seed,
  difficulty,
}: DailyPickInput): DailyChallengePick {
  const { configs } = cachedCatalog;
  const pool = difficulty
    ? configs.filter((c) => c.difficulty === difficulty)
    : configs;
  const list = pool.length > 0 ? pool : configs;
  const config = list[seed % list.length];
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

  return getFractionBuilderPracticeConfig(match[2], match[1] as Difficulty);
}

export const fractionBuilderModule = createGameModule({
  id: "fraction-builder",
  route: "/games/fraction-builder",
  title: "Fraction Builder",
  description: "Build, simplify, and compare fractions.",
  difficulties,
  catalog: cachedCatalog.configs,
  completionSchema: FractionBuilderCompletionSchema,
  translations: fractionBuilderTranslations,
  getCatalog: () => cachedCatalog,
  levelCount: cachedCatalog.configs.length,
  getDailyPick,
  resolveLevelConfig,
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
    // "medium" ⇒ simplify mode and "hard" ⇒ compare mode in the curated
    // catalog: difficulty proxies for the level's mode (the shared achievement
    // system has no mode predicate). __tests__/catalog.test.ts pins that 1:1.
    {
      id: "fb_simplify_master",
      category: "fraction-builder",
      name: "Simplify Master",
      description: "Simplify a fraction correctly.",
      rarity: "rare",
      unlockWhen: { completed: true, difficulty: "medium" },
    },
    {
      id: "fb_compare_expert",
      category: "fraction-builder",
      name: "Comparison Expert",
      description: "Correctly compare two fractions.",
      rarity: "rare",
      unlockWhen: { completed: true, difficulty: "hard" },
    },
  ],
});

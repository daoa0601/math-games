import { createGameModule } from "@math-games/core";
import type { DailyChallengePick, DailyPickInput } from "@math-games/core";

import { catalog, difficulties } from "./catalog";
import type { PatternConfig } from "./catalog";
import { PatternDetectiveCompletionSchema } from "./schema";
import { patternDetectiveTranslations } from "./translations";
import { validate } from "./logic";
import { getPatternDetectivePracticeConfig } from "./generator";

type Difficulty = PatternConfig["difficulty"];

const practiceIdPattern = /^practice_(easy|medium|hard)_(.+)$/;

// The curated catalog is a readonly tuple; copy into a mutable array once
// for the GameCatalog contract.
const catalogConfigs: PatternConfig[] = [...catalog];

function getDailyPick({
  seed,
  difficulty,
}: DailyPickInput): DailyChallengePick {
  const pool = difficulty
    ? catalogConfigs.filter((c) => c.difficulty === difficulty)
    : catalogConfigs;
  const list = pool.length > 0 ? pool : catalogConfigs;
  const config = list[seed % list.length];
  return {
    levelId: config.id,
    title: config.id,
    difficulty: config.difficulty,
  };
}

function resolveLevelConfig(levelId: string): PatternConfig | null {
  const preset = catalogConfigs.find((c) => c.id === levelId);
  if (preset) return preset;

  const match = levelId.match(practiceIdPattern);
  if (!match) return null;

  return getPatternDetectivePracticeConfig(match[2], match[1] as Difficulty);
}

export const patternDetectiveModule = createGameModule({
  id: "pattern-detective",
  route: "/games/pattern-detective",
  title: "Pattern Detective",
  description: "Find the missing number in the sequence.",
  difficulties,
  catalog: catalogConfigs,
  completionSchema: PatternDetectiveCompletionSchema,
  translations: patternDetectiveTranslations,
  getCatalog: () => ({
    configs: catalogConfigs,
    initialConfigId: catalogConfigs[0].id,
    config: catalogConfigs[0],
  }),
  levelCount: catalogConfigs.length,
  getDailyPick,
  resolveLevelConfig,
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

import { createSeededRandom } from "@math-games/core";

import { SEQUENCE_INFO, generateSeededConfig, presetGames } from "./logic";
import type { GameConfig } from "./logic";
import { buildSequenceRaceManifest } from "./manifest";

export type SequenceRaceDifficulty = "easy" | "medium" | "hard";

function normalizePracticeSeed(seed: string) {
  return seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSequenceRaceCatalog() {
  const configs: GameConfig[] = presetGames.map((base) => ({
    ...base,
    manifest: buildSequenceRaceManifest(base),
  }));
  const config = configs.find((game) => game.id === "arith_15") ?? configs[0];

  return {
    config,
    configs,
    initialConfigId: config.id,
    sequenceInfoByType: SEQUENCE_INFO,
  };
}

export function getSequenceRacePracticeConfig(
  seed: string,
  difficulty: SequenceRaceDifficulty = "medium",
) {
  const normalizedSeed = normalizePracticeSeed(seed) || "practice";
  const config = generateSeededConfig(
    createSeededRandom(`sequence-race-practice-${normalizedSeed}`),
    difficulty,
  );

  const base: GameConfig = {
    ...config,
    id: `practice_${difficulty}_${normalizedSeed}`,
    name: `Practice: ${config.name}`,
  };
  return { ...base, manifest: buildSequenceRaceManifest(base) };
}

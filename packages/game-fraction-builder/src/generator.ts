import type { SeededRandom } from "@math-games/core";
import { createDailyRandom, createSeededRandom } from "@math-games/core";

import { catalog, gcd } from "./catalog";
import type { Difficulty, FractionConfig, FractionMode } from "./catalog";
import { buildFractionBuilderManifest } from "./manifest";

// Unlike the curated catalog (where difficulty is pinned 1:1 to a mode),
// generated and practice levels decouple the two: each tier can serve any of
// its allowed modes, and difficulty drives the real knobs — denominator size,
// the multiplier hidden in a simplify task, and how close a comparison is.
const MODE_POOL: Record<Difficulty, FractionMode[]> = {
  easy: ["build"],
  medium: ["build", "simplify"],
  hard: ["simplify", "compare"],
  expert: ["simplify", "compare"],
  master: ["build", "simplify", "compare"],
};

const MAX_DENOM: Record<Difficulty, number> = {
  easy: 6,
  medium: 9,
  hard: 12,
  expert: 16,
  master: 24,
};

const MAX_FACTOR: Record<Difficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 4,
  expert: 6,
  master: 9,
};

function numberChoices(
  rng: SeededRandom,
  required: number[],
  max: number,
  count = 6,
): number[] {
  const set = new Set<number>(required.filter((n) => n > 0));
  let guard = 0;
  while (set.size < count && guard++ < 100) {
    set.add(rng.nextInt(1, Math.max(max, 4)));
  }
  return [...set].sort((a, b) => a - b);
}

/** A reduced fraction a/b (lowest terms) with b in [2, maxDenom], a in [1, b-1]. */
function reducedFraction(
  rng: SeededRandom,
  maxDenom: number,
): [number, number] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const b = rng.nextInt(2, maxDenom);
    const a = rng.nextInt(1, b - 1);
    if (gcd(a, b) === 1) return [a, b];
  }
  return [1, 2];
}

export function generateFraction(
  rng: SeededRandom,
  difficulty: Difficulty,
): FractionConfig {
  const mode = rng.pick(MODE_POOL[difficulty]);
  const maxDenom = MAX_DENOM[difficulty];

  if (mode === "build") {
    const [n, d] = reducedFraction(rng, maxDenom);
    return {
      id: "",
      difficulty,
      mode,
      target: [n, d],
      choices: numberChoices(rng, [n, d], maxDenom),
    };
  }

  if (mode === "simplify") {
    const [a, b] = reducedFraction(rng, Math.max(3, Math.floor(maxDenom / 2)));
    const factor = rng.nextInt(2, MAX_FACTOR[difficulty]);
    return {
      id: "",
      difficulty,
      mode,
      target: [a * factor, b * factor],
      // The player must form the simplified a/b, so both must be pickable.
      choices: numberChoices(rng, [a, b], b * factor),
    };
  }

  // compare — two distinct fractions; higher tiers use larger denominators,
  // which naturally yields closer, harder-to-eyeball comparisons.
  const left = reducedFraction(rng, maxDenom);
  let right = reducedFraction(rng, maxDenom);
  for (let attempt = 0; attempt < 20; attempt++) {
    if (right[0] !== left[0] || right[1] !== left[1]) break;
    right = reducedFraction(rng, maxDenom);
  }
  return {
    id: "",
    difficulty,
    mode,
    target: left,
    compareTo: right,
    choices: [],
  };
}

function normalizeSeed(seed: string): string {
  return (
    seed
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "practice"
  );
}

const generatedCatalogSeeds: ReadonlyArray<readonly [Difficulty, string]> = [
  ["expert", "expert-puzzle"],
  ["master", "master-puzzle"],
];

export function getFractionBuilderCatalog() {
  const generated = generatedCatalogSeeds.map(([difficulty, seed]) => ({
    ...generateFraction(
      createSeededRandom(`fraction-builder-catalog-${difficulty}-${seed}`),
      difficulty,
    ),
    id: `fb-${difficulty}-${seed}`,
  }));
  const configs: FractionConfig[] = [...catalog, ...generated].map((base) => ({
    ...base,
    manifest: buildFractionBuilderManifest(base),
  }));
  const config = configs[0];

  return { config, configs, initialConfigId: config.id };
}

export function getFractionBuilderPracticeConfig(
  seed: string,
  difficulty: Difficulty,
): FractionConfig {
  const normalized = normalizeSeed(seed);
  const base: FractionConfig = {
    ...generateFraction(
      createSeededRandom(
        `fraction-builder-practice-${difficulty}-${normalized}`,
      ),
      difficulty,
    ),
    id: `practice_${difficulty}_${normalized}`,
  };
  return { ...base, manifest: buildFractionBuilderManifest(base, normalized) };
}

export function getDailyFractionBuilderLevel(date?: string): FractionConfig {
  const dateStr = date ?? new Date().toISOString().split("T")[0];
  const rng = createDailyRandom(dateStr, "fraction-builder");
  const difficulty = rng.pick(["medium", "hard", "expert"] as const);
  const base: FractionConfig = {
    ...generateFraction(rng, difficulty),
    id: `daily_${difficulty}_${dateStr}`,
  };
  return { ...base, manifest: buildFractionBuilderManifest(base, dateStr) };
}

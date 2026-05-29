import type { SeededRandom } from "@math-games/core";
import { createDailyRandom, createSeededRandom } from "@math-games/core";

import { catalog } from "./catalog";
import type { Difficulty, EquationConfig, Operator } from "./catalog";
import { substituteAndEvaluate } from "./logic";

// Difficulty is parameterised in code (not just bigger numbers): higher tiers
// add a coefficient on the unknown and extra constant terms, so "expert" and
// "master" require genuinely more steps to undo, not only larger arithmetic.
interface DiffParams {
  mode: EquationConfig["mode"];
  coef: [number, number]; // multiplier on the unknown (1 = none)
  answer: [number, number];
  constA: [number, number]; // first constant added/subtracted
  constB: [number, number] | null; // optional second constant (extra step)
  ops: Operator[];
}

const PARAMS: Record<Difficulty, DiffParams> = {
  easy: {
    mode: "fill",
    coef: [1, 1],
    answer: [1, 9],
    constA: [1, 9],
    constB: null,
    ops: ["+", "-"],
  },
  medium: {
    mode: "one-step",
    coef: [2, 5],
    answer: [2, 9],
    constA: [1, 9],
    constB: null,
    ops: ["+", "-"],
  },
  hard: {
    mode: "two-step",
    coef: [2, 9],
    answer: [2, 9],
    constA: [1, 15],
    constB: null,
    ops: ["+", "-"],
  },
  expert: {
    mode: "two-step",
    coef: [3, 12],
    answer: [2, 12],
    constA: [1, 20],
    constB: [1, 12],
    ops: ["+", "-"],
  },
  master: {
    mode: "two-step",
    coef: [4, 15],
    answer: [3, 15],
    constA: [1, 30],
    constB: [1, 20],
    ops: ["+", "-"],
  },
};

function buildChoices(rng: SeededRandom, answer: number): number[] {
  const set = new Set<number>([answer]);
  for (const offset of rng.shuffle([1, 2, 3, -1, -2, -3])) {
    if (set.size >= 4) break;
    const candidate = answer + offset;
    if (candidate >= 0) set.add(candidate);
  }
  let extra = answer + 4;
  while (set.size < 4) set.add(extra++);
  return rng.shuffle([...set]);
}

export function generateEquation(
  rng: SeededRandom,
  difficulty: Difficulty,
): EquationConfig {
  const params = PARAMS[difficulty];
  const answer = rng.nextInt(params.answer[0], params.answer[1]);

  const leftTerms: (number | "?")[] = [];
  const leftOps: Operator[] = [];

  if (params.mode === "fill") {
    leftTerms.push("?", rng.nextInt(params.constA[0], params.constA[1]));
    leftOps.push(rng.pick(params.ops));
  } else {
    leftTerms.push(rng.nextInt(params.coef[0], params.coef[1]), "?");
    leftOps.push("*");
    leftTerms.push(rng.nextInt(params.constA[0], params.constA[1]));
    leftOps.push(rng.pick(params.ops));
    if (params.constB) {
      leftTerms.push(rng.nextInt(params.constB[0], params.constB[1]));
      leftOps.push(rng.pick(params.ops));
    }
  }

  // Compute the right side from the chosen answer so the level is always
  // consistent, then keep it non-negative (flip subtractions) for young solvers.
  const base = {
    difficulty,
    mode: params.mode,
    leftTerms,
    leftOps,
    answer,
  } as const;
  let rightSide = substituteAndEvaluate(
    { ...base, id: "", rightSide: 0, choices: [] },
    answer,
  );
  if (rightSide < 0) {
    for (let i = 0; i < leftOps.length; i++) {
      if (leftOps[i] === "-") leftOps[i] = "+";
    }
    rightSide = substituteAndEvaluate(
      { ...base, id: "", rightSide: 0, choices: [] },
      answer,
    );
  }

  return {
    ...base,
    id: "",
    rightSide,
    choices: buildChoices(rng, answer),
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

export function getEquationBalanceCatalog() {
  const generated = generatedCatalogSeeds.map(([difficulty, seed]) => ({
    ...generateEquation(
      createSeededRandom(`equation-balance-catalog-${difficulty}-${seed}`),
      difficulty,
    ),
    id: `eb-${difficulty}-${seed}`,
  }));
  const configs = [...catalog, ...generated];
  const config = configs[0];

  return { config, configs, initialConfigId: config.id };
}

export function getEquationBalancePracticeConfig(
  seed: string,
  difficulty: Difficulty,
): EquationConfig {
  const normalized = normalizeSeed(seed);
  return {
    ...generateEquation(
      createSeededRandom(
        `equation-balance-practice-${difficulty}-${normalized}`,
      ),
      difficulty,
    ),
    id: `practice_${difficulty}_${normalized}`,
  };
}

export function getDailyEquationBalanceLevel(date?: string): EquationConfig {
  const dateStr = date ?? new Date().toISOString().split("T")[0];
  const rng = createDailyRandom(dateStr, "equation-balance");
  const difficulty = rng.pick(["medium", "hard", "expert"] as const);
  return {
    ...generateEquation(rng, difficulty),
    id: `daily_${difficulty}_${dateStr}`,
  };
}

// ========================================
// Pattern Detective — Seeded practice generator
// ========================================
//
// Pattern Detective shipped with only 18 hand-authored levels and no practice
// generator, so once a player worked through the catalog there was nothing
// else to play. This generator produces a deterministic, solvable pattern
// puzzle from a seed + difficulty, exercising the same five pattern families
// the curated catalog covers (arithmetic, geometric, fibonacci-like, prime,
// and "custom" formulaic sequences like squares / triangular / pow2-minus-1).
//
// Every generated level is solvable by construction — we generate the full
// sequence first, then poke a hole at a random index and synthesize
// distractors that are close to (but never equal to) the answer.

import type { SeededRandom } from "@math-games/core";
import { createDailyRandom, createSeededRandom } from "@math-games/core";

import type { PatternConfig } from "./catalog";
import { buildPatternDetectiveManifest } from "./manifest";

type Difficulty = PatternConfig["difficulty"];
type PatternType = PatternConfig["patternType"];

/** Difficulty tiers the practice generator exposes (a subset of catalog tiers). */
export type PatternDetectivePracticeDifficulty = "easy" | "medium" | "hard";

interface DifficultyProfile {
  /** Pattern families the generator may draw from at this tier. */
  families: PatternType[];
  /** Number of terms in the generated sequence (including the missing one). */
  length: [number, number];
  /** Range for the common difference / start value. */
  start: [number, number];
  /** Range for arithmetic step or geometric ratio. */
  step: [number, number];
}

const PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: {
    families: ["arithmetic", "geometric"],
    length: [5, 5],
    start: [1, 10],
    step: [2, 6],
  },
  medium: {
    families: ["arithmetic", "geometric", "fibonacci-like", "prime"],
    length: [5, 6],
    start: [1, 12],
    step: [2, 8],
  },
  hard: {
    families: ["arithmetic", "geometric", "fibonacci-like", "prime", "custom"],
    length: [5, 6],
    start: [1, 12],
    step: [2, 9],
  },
};

function pickInRange(rng: SeededRandom, [lo, hi]: [number, number]): number {
  return lo + rng.nextInt(0, hi - lo);
}

function generateArithmetic(rng: SeededRandom, p: DifficultyProfile): number[] {
  const start = pickInRange(rng, p.start);
  const step = pickInRange(rng, p.step);
  const length = pickInRange(rng, p.length);
  return Array.from({ length }, (_, i) => start + i * step);
}

function generateGeometric(rng: SeededRandom, p: DifficultyProfile): number[] {
  const start = pickInRange(rng, [1, 5]);
  const ratio = pickInRange(rng, [2, 4]);
  const length = pickInRange(rng, p.length);
  return Array.from({ length }, (_, i) => start * ratio ** i);
}

function generateFibonacci(rng: SeededRandom, p: DifficultyProfile): number[] {
  const a = pickInRange(rng, [1, 4]);
  const b = pickInRange(rng, [a + 1, a + 5]);
  const length = pickInRange(rng, p.length);
  const seq = [a, b];
  for (let i = 2; i < length; i++) seq.push(seq[i - 1] + seq[i - 2]);
  return seq;
}

function nthPrime(n: number): number {
  // Small-prime sieve — we only ever need the first ~30 primes for this game.
  const primes: number[] = [];
  let candidate = 2;
  while (primes.length <= n) {
    if (primes.every((p) => p * p > candidate || candidate % p !== 0)) {
      primes.push(candidate);
    }
    candidate++;
  }
  return primes[n];
}

function generatePrime(rng: SeededRandom, p: DifficultyProfile): number[] {
  const startN = pickInRange(rng, [0, 6]);
  const length = pickInRange(rng, p.length);
  return Array.from({ length }, (_, i) => nthPrime(startN + i));
}

function generateCustom(rng: SeededRandom, p: DifficultyProfile): number[] {
  const length = pickInRange(rng, p.length);
  // Pick one of three formulaic families: squares, triangular, 2^n - 1.
  const family = rng.nextInt(0, 2);
  const offset = pickInRange(rng, [1, 4]);
  if (family === 0) {
    return Array.from({ length }, (_, i) => (offset + i) ** 2);
  }
  if (family === 1) {
    return Array.from(
      { length },
      (_, i) => ((offset + i) * (offset + i + 1)) / 2,
    );
  }
  return Array.from({ length }, (_, i) => 2 ** (offset + i) - 1);
}

function buildDistractors(
  answer: number,
  rng: SeededRandom,
  count = 3,
): number[] {
  const distractors = new Set<number>();
  const offsets = [-3, -2, -1, 1, 2, 3, 5, -5];
  // Shuffle offsets deterministically (Fisher-Yates via the seeded rng).
  const shuffled = rng.shuffle(offsets);
  for (const off of shuffled) {
    if (distractors.size >= count) break;
    const candidate = answer + off;
    if (candidate === answer) continue;
    if (candidate < 0) continue;
    if (distractors.has(candidate)) continue;
    distractors.add(candidate);
  }
  // Top up if the offsets didn't yield enough.
  let extra = 1;
  while (distractors.size < count) {
    const sign = rng.next() > 0.5 ? 1 : -1;
    const candidate = answer + sign * extra;
    if (candidate !== answer && candidate > 0 && !distractors.has(candidate)) {
      distractors.add(candidate);
    }
    extra++;
    if (extra > 100) break;
  }
  return [...distractors];
}

/**
 * Generate a deterministic pattern-detective level. Always solvable by
 * construction: the sequence is fully generated first, then a term is removed.
 */
export function generateSeededPattern(
  rng: SeededRandom,
  difficulty: Difficulty,
): PatternConfig {
  const profile = PROFILES[difficulty];
  const family = profile.families[rng.nextInt(0, profile.families.length - 1)];

  let sequence: number[];
  switch (family) {
    case "arithmetic":
      sequence = generateArithmetic(rng, profile);
      break;
    case "geometric":
      sequence = generateGeometric(rng, profile);
      break;
    case "fibonacci-like":
      sequence = generateFibonacci(rng, profile);
      break;
    case "prime":
      sequence = generatePrime(rng, profile);
      break;
    case "custom":
      sequence = generateCustom(rng, profile);
      break;
  }

  // Punch a hole somewhere in the middle (never at index 0 or the last index
  // so the player always has neighbours on at least one side).
  const missingIndex = rng.nextInt(1, sequence.length - 2);
  const answer = sequence[missingIndex];
  const display = [...sequence];
  display[missingIndex] = -1;

  const distractors = buildDistractors(answer, rng);

  const config: PatternConfig = {
    id: "", // set by caller
    difficulty,
    patternType: family,
    sequence: display,
    missingIndex,
    answer,
    distractors,
  };
  return { ...config, manifest: buildPatternDetectiveManifest(config) };
}

const PATTERN_DETECTIVE_PRACTICE_PREFIX = "pattern-detective-practice-";

function normalizeSeed(seed: string): string {
  return seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPatternDetectivePracticeConfig(
  seed: string,
  difficulty: PatternDetectivePracticeDifficulty = "medium",
): PatternConfig {
  const normalized = normalizeSeed(seed) || "practice";
  const config = generateSeededPattern(
    createSeededRandom(`${PATTERN_DETECTIVE_PRACTICE_PREFIX}${normalized}`),
    difficulty,
  );
  return { ...config, id: `practice_${difficulty}_${normalized}` };
}

export function getDailyPatternDetectiveLevel(
  dateStr: string,
  difficulty: PatternDetectivePracticeDifficulty = "medium",
): PatternConfig {
  const config = generateSeededPattern(
    createDailyRandom(dateStr, "pattern-detective"),
    difficulty,
  );
  return { ...config, id: `daily_${dateStr}` };
}

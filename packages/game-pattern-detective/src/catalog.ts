import type { LevelManifest } from "@math-games/core";

import { buildPatternDetectiveManifest } from "./manifest";

export interface PatternConfig {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  patternType:
    | "arithmetic"
    | "geometric"
    | "fibonacci-like"
    | "prime"
    | "custom";
  sequence: readonly number[];
  missingIndex: number;
  answer: number;
  distractors: readonly number[];
  hint?: string;
  manifest?: LevelManifest;
}

const patternEntries: readonly PatternConfig[] = [
  // --- Easy: arithmetic sequences ---
  {
    id: "pd-easy-add2",
    difficulty: "easy",
    patternType: "arithmetic",
    sequence: [2, 4, 6, -1, 10],
    missingIndex: 3,
    answer: 8,
    distractors: [7, 9, 12],
    hint: "Each number increases by the same amount.",
  },
  {
    id: "pd-easy-add3",
    difficulty: "easy",
    patternType: "arithmetic",
    sequence: [3, 6, 9, 12, -1],
    missingIndex: 4,
    answer: 15,
    distractors: [13, 14, 18],
  },
  {
    id: "pd-easy-add5",
    difficulty: "easy",
    patternType: "arithmetic",
    sequence: [5, 10, -1, 20, 25],
    missingIndex: 2,
    answer: 15,
    distractors: [12, 14, 16],
  },
  {
    id: "pd-easy-add10",
    difficulty: "easy",
    patternType: "arithmetic",
    sequence: [-1, 20, 30, 40, 50],
    missingIndex: 0,
    answer: 10,
    distractors: [5, 8, 15],
  },
  {
    id: "pd-easy-sub2",
    difficulty: "easy",
    patternType: "arithmetic",
    sequence: [20, 18, 16, -1, 12],
    missingIndex: 3,
    answer: 14,
    distractors: [13, 15, 17],
  },
  {
    id: "pd-easy-double",
    difficulty: "easy",
    patternType: "geometric",
    sequence: [1, 2, 4, -1, 16],
    missingIndex: 3,
    answer: 8,
    distractors: [6, 10, 12],
  },

  // --- Medium: geometric, fibonacci-like, primes ---
  {
    id: "pd-med-triple",
    difficulty: "medium",
    patternType: "geometric",
    sequence: [2, 6, 18, -1, 162],
    missingIndex: 3,
    answer: 54,
    distractors: [36, 48, 72],
  },
  {
    id: "pd-med-fib",
    difficulty: "medium",
    patternType: "fibonacci-like",
    sequence: [1, 1, 2, 3, -1, 8],
    missingIndex: 4,
    answer: 5,
    distractors: [4, 6, 7],
  },
  {
    id: "pd-med-fib2",
    difficulty: "medium",
    patternType: "fibonacci-like",
    sequence: [2, 3, 5, 8, -1, 21],
    missingIndex: 4,
    answer: 13,
    distractors: [10, 11, 15],
  },
  {
    id: "pd-med-prime",
    difficulty: "medium",
    patternType: "prime",
    sequence: [2, 3, 5, 7, -1, 13],
    missingIndex: 4,
    answer: 11,
    distractors: [9, 10, 12],
  },
  {
    id: "pd-med-squares",
    difficulty: "medium",
    patternType: "custom",
    sequence: [1, 4, 9, -1, 25, 36],
    missingIndex: 3,
    answer: 16,
    distractors: [12, 14, 18],
  },
  {
    id: "pd-med-cubes",
    difficulty: "medium",
    patternType: "custom",
    sequence: [1, 8, 27, -1, 125],
    missingIndex: 3,
    answer: 64,
    distractors: [36, 48, 81],
  },

  // --- Hard: multi-step patterns ---
  {
    id: "pd-hard-triangular",
    difficulty: "hard",
    patternType: "custom",
    sequence: [1, 3, 6, 10, -1, 21],
    missingIndex: 4,
    answer: 15,
    distractors: [12, 14, 18],
  },
  {
    id: "pd-hard-alt-sign",
    difficulty: "hard",
    patternType: "custom",
    sequence: [1, -2, 4, -8, -1, -32],
    missingIndex: 4,
    answer: 16,
    distractors: [-16, 10, 24],
  },
  {
    id: "pd-hard-pow2-minus1",
    difficulty: "hard",
    patternType: "custom",
    sequence: [1, 3, 7, 15, -1, 63],
    missingIndex: 4,
    answer: 31,
    distractors: [23, 27, 32],
  },
  {
    id: "pd-hard-factorial",
    difficulty: "hard",
    patternType: "custom",
    sequence: [1, 2, 6, 24, -1, 720],
    missingIndex: 4,
    answer: 120,
    distractors: [48, 60, 100],
  },
  {
    id: "pd-hard-prime-gap",
    difficulty: "hard",
    patternType: "prime",
    sequence: [29, 31, 37, 41, -1, 47],
    missingIndex: 4,
    answer: 43,
    distractors: [42, 44, 45],
  },
  {
    id: "pd-hard-catalan",
    difficulty: "hard",
    patternType: "custom",
    sequence: [1, 1, 2, 5, -1, 42],
    missingIndex: 4,
    answer: 14,
    distractors: [8, 10, 21],
  },
];

export const catalog: readonly PatternConfig[] = patternEntries.map(
  (entry) => ({
    ...entry,
    // Replace the curated distractors with tighter ones — see
    // tightenDistractors. The original distractors were often too far from
    // the answer, making catalog levels trivially guessable.
    distractors: tightenDistractors(entry.answer, entry.difficulty),
    manifest: buildPatternDetectiveManifest(entry),
  }),
);

export const difficulties = ["easy", "medium", "hard"] as const;

/**
 * Tighten distractors so they sit within ±2..±4 of the answer (closest-first),
 * with one further "trap" distractor. The original curated distractors were
 * often far enough from the answer that the correct choice was visually
 * obvious on first glance — observed during playtesting where every catalog
 * level was solved on the first guess. Tighter distractors force the player
 * to actually compute the missing term.
 *
 * Pure: deterministic per (answer, difficulty). Exported for the catalog
 * builder and tests.
 */
export function tightenDistractors(
  answer: number,
  difficulty: "easy" | "medium" | "hard",
): number[] {
  // Harder tiers allow a wider trap window.
  const spread = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
  const candidates: number[] = [];
  for (let off = 1; off <= spread; off++) {
    if (answer - off > 0) candidates.push(answer - off);
    candidates.push(answer + off);
  }
  // Shuffle deterministically by answer so the same level always presents
  // the same distractor set, then keep the first 3.
  const seed = (answer * 2654435761) >>> 0;
  const shuffled = [...candidates];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

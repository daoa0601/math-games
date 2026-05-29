export type FractionMode = "build" | "simplify" | "compare";

export type Difficulty = "easy" | "medium" | "hard" | "expert" | "master";

export interface FractionConfig {
  id: string;
  difficulty: Difficulty;
  mode: FractionMode;
  /** Target fraction as [numerator, denominator] */
  target: readonly [number, number];
  /** Available numbers to choose from */
  choices: readonly number[];
  /** For compare mode: the second fraction to compare against */
  compareTo?: readonly [number, number];
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function isSimplified(n: number, d: number): boolean {
  return gcd(n, d) === 1;
}

export const catalog: readonly FractionConfig[] = [
  // --- Easy: build simple fractions ---
  {
    id: "fb-easy-half",
    difficulty: "easy",
    mode: "build",
    target: [1, 2],
    choices: [1, 2, 3, 4],
  },
  {
    id: "fb-easy-third",
    difficulty: "easy",
    mode: "build",
    target: [1, 3],
    choices: [1, 2, 3, 6],
  },
  {
    id: "fb-easy-quarter",
    difficulty: "easy",
    mode: "build",
    target: [1, 4],
    choices: [1, 2, 4, 8],
  },
  {
    id: "fb-easy-two-thirds",
    difficulty: "easy",
    mode: "build",
    target: [2, 3],
    choices: [1, 2, 3, 4],
  },
  {
    id: "fb-easy-three-quarters",
    difficulty: "easy",
    mode: "build",
    target: [3, 4],
    choices: [1, 2, 3, 4],
  },

  // --- Medium: simplify fractions ---
  {
    id: "fb-med-simplify-2-4",
    difficulty: "medium",
    mode: "simplify",
    target: [2, 4],
    choices: [1, 2, 3, 4],
  },
  {
    id: "fb-med-simplify-3-6",
    difficulty: "medium",
    mode: "simplify",
    target: [3, 6],
    choices: [1, 2, 3, 6],
  },
  {
    id: "fb-med-simplify-4-8",
    difficulty: "medium",
    mode: "simplify",
    target: [4, 8],
    choices: [1, 2, 4, 8],
  },
  {
    id: "fb-med-simplify-6-9",
    difficulty: "medium",
    mode: "simplify",
    target: [6, 9],
    choices: [1, 2, 3, 6, 9],
  },
  {
    id: "fb-med-simplify-10-15",
    difficulty: "medium",
    mode: "simplify",
    target: [10, 15],
    choices: [1, 2, 3, 5, 10, 15],
  },
  {
    id: "fb-med-simplify-8-12",
    difficulty: "medium",
    mode: "simplify",
    target: [8, 12],
    choices: [1, 2, 3, 4, 6, 8, 12],
  },

  // --- Hard: compare fractions ---
  {
    id: "fb-hard-compare-half-third",
    difficulty: "hard",
    mode: "compare",
    target: [1, 2],
    compareTo: [1, 3],
    choices: [],
  },
  {
    id: "fb-hard-compare-2-3-vs-3-4",
    difficulty: "hard",
    mode: "compare",
    target: [2, 3],
    compareTo: [3, 4],
    choices: [],
  },
  {
    id: "fb-hard-compare-3-5-vs-2-3",
    difficulty: "hard",
    mode: "compare",
    target: [3, 5],
    compareTo: [2, 3],
    choices: [],
  },
  {
    id: "fb-hard-compare-5-8-vs-7-12",
    difficulty: "hard",
    mode: "compare",
    target: [5, 8],
    compareTo: [7, 12],
    choices: [],
  },
  {
    id: "fb-hard-compare-4-7-vs-3-5",
    difficulty: "hard",
    mode: "compare",
    target: [4, 7],
    compareTo: [3, 5],
    choices: [],
  },
  {
    id: "fb-hard-compare-5-6-vs-7-8",
    difficulty: "hard",
    mode: "compare",
    target: [5, 6],
    compareTo: [7, 8],
    choices: [],
  },
];

export { gcd, isSimplified };

export const difficulties = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master",
] as const;

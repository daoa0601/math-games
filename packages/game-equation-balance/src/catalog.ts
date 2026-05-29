import type { LevelManifest } from "@math-games/core";

export type EquationMode = "fill" | "one-step" | "two-step";

export type Operator = "+" | "-" | "*";

export type Difficulty = "easy" | "medium" | "hard" | "expert" | "master";

export interface EquationConfig {
  id: string;
  difficulty: Difficulty;
  mode: EquationMode;
  /** Left side terms: numbers or "?" for the unknown */
  leftTerms: readonly (number | "?")[];
  /** Operators between left terms */
  leftOps: readonly Operator[];
  /** Right side value (always a number) */
  rightSide: number;
  /** The correct answer for "?" */
  answer: number;
  /** Choices to pick from */
  choices: readonly number[];
  /** Pedagogical metadata (skills, misconceptions, difficulty signals). */
  manifest?: LevelManifest;
}

function evaluate(terms: readonly number[], ops: readonly Operator[]): number {
  let result = terms[0];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    const next = terms[i + 1];
    if (op === "+") result += next;
    else if (op === "-") result -= next;
    else result *= next;
  }
  return result;
}

export { evaluate };

export const catalog: readonly EquationConfig[] = [
  // --- Easy: fill in the blank (? + a = b) ---
  {
    id: "eb-easy-add-5",
    difficulty: "easy",
    mode: "fill",
    leftTerms: ["?", 3],
    leftOps: ["+"],
    rightSide: 8,
    answer: 5,
    choices: [3, 4, 5, 6],
  },
  {
    id: "eb-easy-add-7",
    difficulty: "easy",
    mode: "fill",
    leftTerms: [4, "?"],
    leftOps: ["+"],
    rightSide: 11,
    answer: 7,
    choices: [5, 6, 7, 8],
  },
  {
    id: "eb-easy-sub-3",
    difficulty: "easy",
    mode: "fill",
    leftTerms: [10, "?"],
    leftOps: ["-"],
    rightSide: 7,
    answer: 3,
    choices: [2, 3, 4, 7],
  },
  {
    id: "eb-easy-sub-6",
    difficulty: "easy",
    mode: "fill",
    leftTerms: ["?", 4],
    leftOps: ["-"],
    rightSide: 6,
    answer: 10,
    choices: [8, 9, 10, 12],
  },
  {
    id: "eb-easy-mul-3",
    difficulty: "easy",
    mode: "fill",
    leftTerms: ["?", 4],
    leftOps: ["*"],
    rightSide: 12,
    answer: 3,
    choices: [2, 3, 4, 6],
  },

  // --- Medium: one-step solve (a * ? + b = c → find ?) ---
  {
    id: "eb-med-2x-plus-1",
    difficulty: "medium",
    mode: "one-step",
    leftTerms: [2, "?", 1],
    leftOps: ["*", "+"],
    rightSide: 9,
    answer: 4,
    choices: [3, 4, 5, 6],
  },
  {
    id: "eb-med-3x-minus-2",
    difficulty: "medium",
    mode: "one-step",
    leftTerms: [3, "?", 2],
    leftOps: ["*", "-"],
    rightSide: 7,
    answer: 3,
    choices: [2, 3, 4, 5],
  },
  {
    id: "eb-med-5x-plus-3",
    difficulty: "medium",
    mode: "one-step",
    leftTerms: [5, "?", 3],
    leftOps: ["*", "+"],
    rightSide: 18,
    answer: 3,
    choices: [2, 3, 4, 5],
  },
  {
    id: "eb-med-4x-minus-5",
    difficulty: "medium",
    mode: "one-step",
    leftTerms: [4, "?", 5],
    leftOps: ["*", "-"],
    rightSide: 15,
    answer: 5,
    choices: [3, 4, 5, 6],
  },
  {
    id: "eb-med-2x-plus-7",
    difficulty: "medium",
    mode: "one-step",
    leftTerms: [2, "?", 7],
    leftOps: ["*", "+"],
    rightSide: 17,
    answer: 5,
    choices: [4, 5, 6, 7],
  },

  // --- Hard: two-step solve (larger numbers, multi-op with single unknown) ---
  {
    // 4 * ? + 3 = 23 → (4*5)+3=23
    id: "eb-hard-4x-plus-3",
    difficulty: "hard",
    mode: "two-step",
    leftTerms: [4, "?", 3],
    leftOps: ["*", "+"],
    rightSide: 23,
    answer: 5,
    choices: [4, 5, 6, 7],
  },
  {
    // 6 * ? - 8 = 22 → (6*5)-8=22
    id: "eb-hard-6x-minus-8",
    difficulty: "hard",
    mode: "two-step",
    leftTerms: [6, "?", 8],
    leftOps: ["*", "-"],
    rightSide: 22,
    answer: 5,
    choices: [4, 5, 6, 7],
  },
  {
    // 7 * ? + 2 = 30 → (7*4)+2=30
    id: "eb-hard-7x-plus-2",
    difficulty: "hard",
    mode: "two-step",
    leftTerms: [7, "?", 2],
    leftOps: ["*", "+"],
    rightSide: 30,
    answer: 4,
    choices: [3, 4, 5, 6],
  },
  {
    // 8 * ? - 3 = 37 → (8*5)-3=37
    id: "eb-hard-8x-minus-3",
    difficulty: "hard",
    mode: "two-step",
    leftTerms: [8, "?", 3],
    leftOps: ["*", "-"],
    rightSide: 37,
    answer: 5,
    choices: [4, 5, 6, 7],
  },
  {
    // 9 * ? + 1 = 28 → (9*3)+1=28
    id: "eb-hard-9x-plus-1",
    difficulty: "hard",
    mode: "two-step",
    leftTerms: [9, "?", 1],
    leftOps: ["*", "+"],
    rightSide: 28,
    answer: 3,
    choices: [2, 3, 4, 5],
  },
  {
    // 5 * ? - 7 = 18 → (5*5)-7=18
    id: "eb-hard-5x-minus-7",
    difficulty: "hard",
    mode: "two-step",
    leftTerms: [5, "?", 7],
    leftOps: ["*", "-"],
    rightSide: 18,
    answer: 5,
    choices: [4, 5, 6, 7],
  },
];

export const difficulties = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master",
] as const;

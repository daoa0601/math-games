import type { GameFeedback } from "@math-games/core";

import type { FractionConfig } from "./catalog";
import { gcd, isSimplified } from "./catalog";
import type { FractionBuilderCompletion } from "./schema";

function fractionValue(n: number, d: number): number {
  return d === 0 ? NaN : n / d;
}

function fractionsEqual(
  n1: number,
  d1: number,
  n2: number,
  d2: number,
): boolean {
  if (d1 === 0 || d2 === 0) return false;
  return n1 * d2 === n2 * d1;
}

export function validate(
  level: FractionConfig,
  completion: FractionBuilderCompletion,
): { completed: boolean; moves: number; feedback?: GameFeedback } {
  const { numerator: n, denominator: d } = completion;
  const [targetN, targetD] = level.target;

  if (d === 0) {
    return {
      completed: false,
      moves: 1,
      feedback: {
        kind: "misconception",
        labelKey: "fb.feedback.zero_denominator",
      },
    };
  }

  switch (level.mode) {
    case "build": {
      const correct = fractionsEqual(n, d, targetN, targetD);
      if (!correct) {
        return {
          completed: false,
          moves: 1,
          feedback: {
            kind: "misconception",
            labelKey: "fb.feedback.not_equal",
            params: { n, d, targetN, targetD },
          },
        };
      }
      return { completed: true, moves: 1 };
    }

    case "simplify": {
      const equivalent = fractionsEqual(n, d, targetN, targetD);
      const simplified = isSimplified(n, d);
      if (!equivalent) {
        return {
          completed: false,
          moves: 1,
          feedback: {
            kind: "misconception",
            labelKey: "fb.feedback.not_equivalent",
            params: { n, d, targetN, targetD },
          },
        };
      }
      if (!simplified) {
        const g = gcd(n, d);
        return {
          completed: false,
          moves: 1,
          feedback: {
            kind: "misconception",
            labelKey: "fb.feedback.not_simplified",
            params: { n, d, divisor: g },
          },
        };
      }
      return { completed: true, moves: 1 };
    }

    case "compare": {
      if (!level.compareTo) {
        return { completed: false, moves: 1 };
      }
      const [compN, compD] = level.compareTo;
      const leftVal = fractionValue(targetN, targetD);
      const rightVal = fractionValue(compN, compD);

      let correctAnswer: string;
      if (leftVal > rightVal) correctAnswer = "left";
      else if (leftVal < rightVal) correctAnswer = "right";
      else correctAnswer = "equal";

      const correct = completion.compareAnswer === correctAnswer;
      if (!correct) {
        const labelKey =
          correctAnswer === "left"
            ? "fb.feedback.compare_greater"
            : correctAnswer === "right"
              ? "fb.feedback.compare_less"
              : "fb.feedback.compare_equal";
        return {
          completed: false,
          moves: 1,
          feedback: {
            kind: "misconception",
            labelKey,
            params: { targetN, targetD, compN, compD },
          },
        };
      }
      return { completed: true, moves: 1 };
    }
  }
}

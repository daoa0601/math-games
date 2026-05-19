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
        kind: "generic",
        message: "Denominator cannot be zero.",
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
            kind: "generic",
            message: `${n}/${d} does not equal ${targetN}/${targetD}.`,
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
            kind: "generic",
            message: `${n}/${d} is not equivalent to ${targetN}/${targetD}.`,
          },
        };
      }
      if (!simplified) {
        const g = gcd(n, d);
        return {
          completed: false,
          moves: 1,
          feedback: {
            kind: "generic",
            message: `${n}/${d} can be simplified further (divide by ${g}).`,
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
        return {
          completed: false,
          moves: 1,
          feedback: {
            kind: "generic",
            message: `Incorrect. ${targetN}/${targetD} is ${correctAnswer === "left" ? "greater than" : correctAnswer === "right" ? "less than" : "equal to"} ${compN}/${compD}.`,
          },
        };
      }
      return { completed: true, moves: 1 };
    }
  }
}

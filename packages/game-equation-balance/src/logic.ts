import type { GameFeedback } from "@math-games/core";

import type { EquationConfig } from "./catalog";
import { evaluate } from "./catalog";
import type { EquationBalanceCompletion } from "./schema";

export function substituteAndEvaluate(
  level: EquationConfig,
  value: number,
): number {
  const terms = level.leftTerms.map((t) => (t === "?" ? value : t));
  return evaluate(terms, level.leftOps);
}

export function formatEquation(level: EquationConfig): string {
  const parts: string[] = [];
  for (let i = 0; i < level.leftTerms.length; i++) {
    if (i > 0) parts.push(` ${level.leftOps[i - 1]} `);
    parts.push(level.leftTerms[i] === "?" ? "?" : String(level.leftTerms[i]));
  }
  return `${parts.join("")} = ${level.rightSide}`;
}

export function validate(
  level: EquationConfig,
  completion: EquationBalanceCompletion,
): { completed: boolean; moves: number; feedback?: GameFeedback } {
  const { answer } = completion;
  const result = substituteAndEvaluate(level, answer);
  const correct = result === level.rightSide;

  if (!correct) {
    return {
      completed: false,
      moves: 1,
      feedback: {
        kind: "generic",
        message: `Substituting ${answer} gives ${result}, not ${level.rightSide}.`,
      },
    };
  }

  return { completed: true, moves: 1 };
}

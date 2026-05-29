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

export type EquationTokenRole =
  | "operand"
  | "operator"
  | "unknown"
  | "equals"
  | "rhs";

export interface EquationToken {
  text: string;
  role: EquationTokenRole;
}

/**
 * Structured tokens for rendering the equation. Roles come from the level's
 * config rather than re-parsing a formatted string or matching values, so the
 * unknown and right-hand side are identified unambiguously (a left operand that
 * happens to equal the right side is not mistaken for it).
 */
export function formatEquationTokens(level: EquationConfig): EquationToken[] {
  const tokens: EquationToken[] = [];
  for (let i = 0; i < level.leftTerms.length; i++) {
    if (i > 0) {
      const op = level.leftOps[i - 1];
      tokens.push({ text: op === "*" ? "×" : op, role: "operator" });
    }
    const term = level.leftTerms[i];
    tokens.push(
      term === "?"
        ? { text: "?", role: "unknown" }
        : { text: String(term), role: "operand" },
    );
  }
  tokens.push({ text: "=", role: "equals" });
  tokens.push({ text: String(level.rightSide), role: "rhs" });
  return tokens;
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
        kind: "misconception",
        labelKey: "eb.feedback.wrong_substitution",
        params: { answer, result, rightSide: level.rightSide },
      },
    };
  }

  return { completed: true, moves: 1 };
}

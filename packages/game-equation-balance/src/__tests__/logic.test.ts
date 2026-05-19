import { describe, expect, test } from "vitest";
import type { GameFeedback } from "@math-games/core";
import { validate, substituteAndEvaluate, formatEquation } from "../logic";
import type { EquationConfig } from "../catalog";
import { evaluate } from "../catalog";

function feedbackMessage(fb: GameFeedback | undefined): string | undefined {
  return fb?.kind === "generic" ? fb.message : undefined;
}

describe("evaluate", () => {
  test("addition", () => expect(evaluate([3, 5], ["+"])).toBe(8));
  test("subtraction", () => expect(evaluate([10, 3], ["-"])).toBe(7));
  test("multiplication", () => expect(evaluate([4, 3], ["*"])).toBe(12));
  test("chained: 2*4+1", () => expect(evaluate([2, 4, 1], ["*", "+"])).toBe(9));
  test("chained: 5*3-2", () =>
    expect(evaluate([5, 3, 2], ["*", "-"])).toBe(13));
});

describe("formatEquation", () => {
  test("formats fill-in", () => {
    const level: EquationConfig = {
      id: "t",
      difficulty: "easy",
      mode: "fill",
      leftTerms: ["?", 3],
      leftOps: ["+"],
      rightSide: 8,
      answer: 5,
      choices: [],
    };
    expect(formatEquation(level)).toBe("? + 3 = 8");
  });

  test("formats one-step", () => {
    const level: EquationConfig = {
      id: "t",
      difficulty: "medium",
      mode: "one-step",
      leftTerms: [2, "?", 1],
      leftOps: ["*", "+"],
      rightSide: 9,
      answer: 4,
      choices: [],
    };
    expect(formatEquation(level)).toBe("2 * ? + 1 = 9");
  });
});

describe("substituteAndEvaluate", () => {
  test("substitutes and evaluates", () => {
    const level: EquationConfig = {
      id: "t",
      difficulty: "easy",
      mode: "fill",
      leftTerms: ["?", 3],
      leftOps: ["+"],
      rightSide: 8,
      answer: 5,
      choices: [],
    };
    expect(substituteAndEvaluate(level, 5)).toBe(8);
    expect(substituteAndEvaluate(level, 3)).toBe(6);
  });
});

describe("validate — fill mode", () => {
  const level: EquationConfig = {
    id: "test-fill",
    difficulty: "easy",
    mode: "fill",
    leftTerms: ["?", 3],
    leftOps: ["+"],
    rightSide: 8,
    answer: 5,
    choices: [3, 4, 5, 6],
  };

  test("correct answer completes", () => {
    const result = validate(level, { answer: 5 });
    expect(result.completed).toBe(true);
  });

  test("wrong answer fails with feedback", () => {
    const result = validate(level, { answer: 4 });
    expect(result.completed).toBe(false);
    expect(feedbackMessage(result.feedback)).toContain("Substituting 4");
    expect(feedbackMessage(result.feedback)).toContain("gives 7");
  });
});

describe("validate — one-step mode", () => {
  const level: EquationConfig = {
    id: "test-one-step",
    difficulty: "medium",
    mode: "one-step",
    leftTerms: [2, "?", 1],
    leftOps: ["*", "+"],
    rightSide: 9,
    answer: 4,
    choices: [3, 4, 5, 6],
  };

  test("correct answer completes", () => {
    const result = validate(level, { answer: 4 });
    expect(result.completed).toBe(true);
  });

  test("wrong answer fails", () => {
    const result = validate(level, { answer: 3 });
    expect(result.completed).toBe(false);
  });
});

describe("validate — two-step mode", () => {
  // 4 * ? + 3 = 23 → answer is 5: (4*5)+3=23
  const level: EquationConfig = {
    id: "test-two-step",
    difficulty: "hard",
    mode: "two-step",
    leftTerms: [4, "?", 3],
    leftOps: ["*", "+"],
    rightSide: 23,
    answer: 5,
    choices: [4, 5, 6, 7],
  };

  test("correct answer completes", () => {
    const result = validate(level, { answer: 5 });
    expect(result.completed).toBe(true);
  });

  test("wrong answer fails with substitution feedback", () => {
    const result = validate(level, { answer: 4 });
    expect(result.completed).toBe(false);
    expect(feedbackMessage(result.feedback)).toContain("not 23");
  });
});

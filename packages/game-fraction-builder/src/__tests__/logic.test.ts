import { describe, expect, test } from "vitest";
import type { GameFeedback } from "@math-games/core";
import { validate } from "../logic";
import type { FractionConfig } from "../catalog";
import { gcd, isSimplified } from "../catalog";

function feedbackMessage(fb: GameFeedback | undefined): string | undefined {
  return fb?.kind === "generic" ? fb.message : undefined;
}

describe("gcd", () => {
  test("gcd(6, 9) = 3", () => expect(gcd(6, 9)).toBe(3));
  test("gcd(1, 7) = 1", () => expect(gcd(1, 7)).toBe(1));
  test("gcd(12, 8) = 4", () => expect(gcd(12, 8)).toBe(4));
  test("gcd(0, 5) = 5", () => expect(gcd(0, 5)).toBe(5));
});

describe("isSimplified", () => {
  test("1/2 is simplified", () => expect(isSimplified(1, 2)).toBe(true));
  test("2/4 is not simplified", () => expect(isSimplified(2, 4)).toBe(false));
  test("3/7 is simplified", () => expect(isSimplified(3, 7)).toBe(true));
});

describe("build mode", () => {
  const level: FractionConfig = {
    id: "test-build",
    difficulty: "easy",
    mode: "build",
    target: [1, 2],
    choices: [1, 2, 3, 4],
  };

  test("correct fraction completes", () => {
    const result = validate(level, { numerator: 1, denominator: 2 });
    expect(result.completed).toBe(true);
  });

  test("equivalent fraction completes", () => {
    const result = validate(level, { numerator: 2, denominator: 4 });
    expect(result.completed).toBe(true);
  });

  test("wrong fraction fails", () => {
    const result = validate(level, { numerator: 1, denominator: 3 });
    expect(result.completed).toBe(false);
    expect(feedbackMessage(result.feedback)).toContain("does not equal");
  });

  test("zero denominator fails", () => {
    const result = validate(level, { numerator: 1, denominator: 0 });
    expect(result.completed).toBe(false);
    expect(feedbackMessage(result.feedback)).toContain("zero");
  });
});

describe("simplify mode", () => {
  const level: FractionConfig = {
    id: "test-simplify",
    difficulty: "medium",
    mode: "simplify",
    target: [4, 8],
    choices: [1, 2, 4, 8],
  };

  test("simplified equivalent completes", () => {
    const result = validate(level, { numerator: 1, denominator: 2 });
    expect(result.completed).toBe(true);
  });

  test("unsimplified equivalent fails with hint", () => {
    const result = validate(level, { numerator: 2, denominator: 4 });
    expect(result.completed).toBe(false);
    expect(feedbackMessage(result.feedback)).toContain("simplified further");
  });

  test("non-equivalent fraction fails", () => {
    const result = validate(level, { numerator: 1, denominator: 3 });
    expect(result.completed).toBe(false);
    expect(feedbackMessage(result.feedback)).toContain("not equivalent");
  });
});

describe("compare mode", () => {
  const level: FractionConfig = {
    id: "test-compare",
    difficulty: "hard",
    mode: "compare",
    target: [1, 2],
    compareTo: [1, 3],
    choices: [],
  };

  test("correct answer (left is bigger) completes", () => {
    const result = validate(level, {
      numerator: 0,
      denominator: 1,
      compareAnswer: "left",
    });
    expect(result.completed).toBe(true);
  });

  test("wrong answer fails with explanation", () => {
    const result = validate(level, {
      numerator: 0,
      denominator: 1,
      compareAnswer: "right",
    });
    expect(result.completed).toBe(false);
    expect(feedbackMessage(result.feedback)).toContain("greater than");
  });

  test("equal fractions", () => {
    const equalLevel: FractionConfig = {
      id: "test-equal",
      difficulty: "hard",
      mode: "compare",
      target: [1, 2],
      compareTo: [2, 4],
      choices: [],
    };
    const result = validate(equalLevel, {
      numerator: 0,
      denominator: 1,
      compareAnswer: "equal",
    });
    expect(result.completed).toBe(true);
  });
});

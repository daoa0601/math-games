import { describe, expect, test } from "vitest";

import { catalog } from "../catalog";
import type { PatternConfig } from "../catalog";
import { shuffleChoices, validate } from "../logic";

describe("PatternDetective validation", () => {
  test("correct answer completes the level", () => {
    const level: PatternConfig = {
      id: "test",
      difficulty: "easy",
      patternType: "arithmetic",
      sequence: [2, 4, 6, -1, 10],
      missingIndex: 3,
      answer: 8,
      distractors: [7, 9, 12],
    };

    const result = validate(level, { selectedAnswer: 8 });
    expect(result.completed).toBe(true);
    expect(result.moves).toBe(1);
    expect(result.feedback).toBeUndefined();
  });

  test("wrong answer returns targeted misconception feedback", () => {
    const level: PatternConfig = {
      id: "test",
      difficulty: "easy",
      patternType: "arithmetic",
      sequence: [2, 4, 6, -1, 10],
      missingIndex: 3,
      answer: 8,
      distractors: [7, 9, 12],
    };

    const result = validate(level, { selectedAnswer: 7 });
    expect(result.completed).toBe(false);
    expect(result.feedback).toBeDefined();
    expect(result.feedback?.kind).toBe("misconception");
    if (result.feedback?.kind === "misconception") {
      expect(result.feedback.labelKey).toMatch(/^pd\.feedback\./);
      expect(result.feedback.params).toHaveProperty("selected", 7);
    }
  });

  test("too-large guess gets the too_large label", () => {
    const level: PatternConfig = {
      id: "test",
      difficulty: "easy",
      patternType: "arithmetic",
      sequence: [2, 4, 6, -1, 10],
      missingIndex: 3,
      answer: 8,
      distractors: [7, 9, 12],
    };
    const result = validate(level, { selectedAnswer: 12 });
    expect(result.feedback?.kind).toBe("misconception");
    if (result.feedback?.kind === "misconception") {
      expect(result.feedback.labelKey).toBe("pd.feedback.too_large");
    }
  });

  test("too-small guess gets the too_small label", () => {
    const level: PatternConfig = {
      id: "test",
      difficulty: "easy",
      patternType: "arithmetic",
      sequence: [2, 4, 6, -1, 10],
      missingIndex: 3,
      answer: 8,
      distractors: [7, 9, 12],
    };
    const result = validate(level, { selectedAnswer: 5 });
    expect(result.feedback?.kind).toBe("misconception");
    if (result.feedback?.kind === "misconception") {
      expect(result.feedback.labelKey).toBe("pd.feedback.too_small");
    }
  });

  test("string answer matching number works", () => {
    const level: PatternConfig = {
      id: "test",
      difficulty: "easy",
      patternType: "arithmetic",
      sequence: [2, 4, 6, -1, 10],
      missingIndex: 3,
      answer: 8,
      distractors: [7, 9, 12],
    };

    const result = validate(level, { selectedAnswer: "8" });
    expect(result.completed).toBe(true);
  });
});

describe("shuffleChoices", () => {
  test("returns all choices including the answer", () => {
    const choices = shuffleChoices(8, [7, 9, 12], 42);
    expect(choices).toHaveLength(4);
    expect(choices).toContain(8);
    expect(choices).toContain(7);
    expect(choices).toContain(9);
    expect(choices).toContain(12);
  });

  test("same seed produces same order", () => {
    const a = shuffleChoices(8, [7, 9, 12], 42);
    const b = shuffleChoices(8, [7, 9, 12], 42);
    expect(a).toEqual(b);
  });

  test("different seed produces different order", () => {
    const a = shuffleChoices(8, [7, 9, 12], 1);
    const b = shuffleChoices(8, [7, 9, 12], 99999);
    expect(a.join(",")).not.toBe(b.join(","));
  });
});

describe("catalog integrity", () => {
  test("every level has a unique id", () => {
    const ids = catalog.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every level answer is in the sequence at missingIndex", () => {
    for (const level of catalog) {
      expect(level.sequence[level.missingIndex]).toBe(-1);
    }
  });

  test("every level has exactly 3 distractors", () => {
    for (const level of catalog) {
      expect(level.distractors).toHaveLength(3);
    }
  });

  test("answer is not among distractors", () => {
    for (const level of catalog) {
      expect(level.distractors).not.toContain(level.answer);
    }
  });

  test("correct answer validates for every catalog level", () => {
    for (const level of catalog) {
      const result = validate(level, { selectedAnswer: level.answer });
      expect(
        result.completed,
        `${level.id} should complete with answer ${level.answer}`,
      ).toBe(true);
    }
  });
});

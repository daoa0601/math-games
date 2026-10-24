import { describe, expect, test } from "vitest";

import { createSeededRandom } from "@math-games/core";

import {
  generateSeededPattern,
  getDailyPatternDetectiveLevel,
  getPatternDetectivePracticeConfig,
} from "../generator";
import { validate } from "../logic";

for (const difficulty of ["easy", "medium", "hard"] as const) {
  describe(`pattern-detective generator (${difficulty})`, () => {
    test("produces a level with a single hole and the right answer", () => {
      const level = generateSeededPattern(
        createSeededRandom(`gen-${difficulty}-1`),
        difficulty,
      );
      const holes = level.sequence.filter((n) => n === -1);
      expect(holes).toHaveLength(1);
      expect(level.sequence[level.missingIndex]).toBe(-1);
      expect(level.answer).toBeGreaterThan(0);
      expect(level.distractors).toHaveLength(3);
      expect(level.distractors).not.toContain(level.answer);
    });

    test("the answer validates against the level", () => {
      const level = generateSeededPattern(
        createSeededRandom(`gen-${difficulty}-2`),
        difficulty,
      );
      const result = validate(level, { selectedAnswer: level.answer });
      expect(result.completed).toBe(true);
    });

    test("is deterministic for the same seed", () => {
      const a = generateSeededPattern(
        createSeededRandom(`gen-${difficulty}-seed`),
        difficulty,
      );
      const b = generateSeededPattern(
        createSeededRandom(`gen-${difficulty}-seed`),
        difficulty,
      );
      expect(a.sequence).toEqual(b.sequence);
      expect(a.answer).toBe(b.answer);
    });

    test("distractors are distinct from each other and the answer", () => {
      const level = generateSeededPattern(
        createSeededRandom(`gen-${difficulty}-3`),
        difficulty,
      );
      const set = new Set(level.distractors);
      expect(set.size).toBe(level.distractors.length);
      expect(set.has(level.answer)).toBe(false);
    });

    test("the hole is never at the first or last index", () => {
      for (let i = 0; i < 20; i++) {
        const level = generateSeededPattern(
          createSeededRandom(`gen-${difficulty}-hole-${i}`),
          difficulty,
        );
        expect(level.missingIndex).toBeGreaterThan(0);
        expect(level.missingIndex).toBeLessThan(level.sequence.length - 1);
      }
    });
  });
}

describe("getPatternDetectivePracticeConfig", () => {
  test("produces a deterministic id tagged with difficulty", () => {
    const a = getPatternDetectivePracticeConfig("hello world", "medium");
    const b = getPatternDetectivePracticeConfig("hello world", "medium");
    expect(a.id).toBe("practice_medium_hello-world");
    expect(a.sequence).toEqual(b.sequence);
  });

  test("falls back to a default seed for empty input", () => {
    const a = getPatternDetectivePracticeConfig("   ", "easy");
    expect(a.id).toBe("practice_easy_practice");
  });
});

describe("getDailyPatternDetectiveLevel", () => {
  test("is deterministic per date", () => {
    const a = getDailyPatternDetectiveLevel("2026-07-19", "medium");
    const b = getDailyPatternDetectiveLevel("2026-07-19", "medium");
    expect(a.sequence).toEqual(b.sequence);
    expect(a.id).toBe("daily_2026-07-19");
  });
});

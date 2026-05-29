import { describe, expect, test } from "vitest";
import { catalog } from "../catalog";
import type { Difficulty, FractionMode } from "../catalog";

// The achievements gate "Simplify Master"/"Comparison Expert" on difficulty
// (medium/hard) as a proxy for the level's mode, because the shared achievement
// system has no `mode` predicate. This pins the difficulty↔mode alignment that
// proxy depends on, so a future mismatched level (e.g. a medium "build") fails
// loudly here instead of silently mis-awarding an achievement. Generated
// expert/master levels deliberately mix modes and live outside this curated
// array, so the invariant only covers the tiers the achievements depend on.
describe("fraction-builder catalog difficulty↔mode invariant", () => {
  const modeByDifficulty: Partial<Record<Difficulty, FractionMode>> = {
    easy: "build",
    medium: "simplify",
    hard: "compare",
  };

  test("difficulty maps 1:1 to mode across the curated catalog", () => {
    for (const level of catalog) {
      const expected = modeByDifficulty[level.difficulty];
      if (expected) expect(level.mode, level.id).toBe(expected);
    }
  });
});

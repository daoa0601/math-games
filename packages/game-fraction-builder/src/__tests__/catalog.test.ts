import { describe, expect, test } from "vitest";
import { catalog } from "../catalog";

// The achievements gate "Simplify Master"/"Comparison Expert" on difficulty
// (medium/hard) as a proxy for the level's mode, because the shared achievement
// system has no `mode` predicate. This pins the difficulty↔mode alignment that
// proxy depends on, so a future mismatched level (e.g. a medium "build") fails
// loudly here instead of silently mis-awarding an achievement.
describe("fraction-builder catalog difficulty↔mode invariant", () => {
  const modeByDifficulty = {
    easy: "build",
    medium: "simplify",
    hard: "compare",
  } as const;

  test("difficulty maps 1:1 to mode across the catalog", () => {
    for (const level of catalog) {
      expect(level.mode, level.id).toBe(modeByDifficulty[level.difficulty]);
    }
  });
});

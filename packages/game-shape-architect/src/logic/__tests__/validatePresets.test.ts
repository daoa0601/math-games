import { describe, it, expect } from "vitest";
import { presetLevels } from "../presets";
import { solvePuzzle } from "../solver";
import { validateLevelVolume } from "../engine";

/**
 * Preset Level Validation Tests
 *
 * These tests ensure all preset levels are mathematically valid and solvable.
 * This catches design errors like:
 * - Volume mismatches (pieces don't match target)
 * - Impossible shapes (geometrically unsolvable)
 * - Levels that timeout (too complex for reasonable solve time)
 */

describe("Preset Level Validation", () => {
  describe("Volume Validation", () => {
    presetLevels.forEach((level) => {
      it(`${level.id} (${level.name}) should have matching volume`, () => {
        const validation = validateLevelVolume(level);

        if (!validation.isValid) {
          console.log(`Volume mismatch for ${level.id}:
                        Target cells: ${validation.targetVolume}
                        Piece cells: ${validation.pieceVolume}
                        Difference: ${validation.volumeDifference > 0 ? "+" : ""}${validation.volumeDifference}`);
        }

        expect(validation.isValid, validation.message).toBe(true);
      });
    });
  });

  describe("Solvability Validation", () => {
    // Group by difficulty for better timeout management
    const easyLevels = presetLevels.filter((l) => l.difficulty === "easy");
    const mediumLevels = presetLevels.filter((l) => l.difficulty === "medium");
    const hardLevels = presetLevels.filter((l) => l.difficulty === "hard");

    describe("Easy Levels", () => {
      easyLevels.forEach((level) => {
        it(`${level.id} (${level.name}) should be solvable`, () => {
          const result = solvePuzzle(level, 30000); // 30s timeout

          if (!result.solvable && !result.timedOut) {
            console.log(`Unsolvable: ${level.id}
                            Searched states: ${result.searchedStates}
                            Time: ${result.timeMs.toFixed(2)}ms`);
          }

          expect(
            result.timedOut,
            `${level.id} timed out after ${result.timeMs.toFixed(2)}ms`,
          ).toBe(false);
          expect(result.solvable, `${level.id} is not solvable`).toBe(true);
        }, 35000); // 35s test timeout
      });
    });

    describe("Medium Levels", () => {
      mediumLevels.forEach((level) => {
        it(`${level.id} (${level.name}) should be solvable`, () => {
          const result = solvePuzzle(level, 30000);

          if (!result.solvable && !result.timedOut) {
            console.log(`Unsolvable: ${level.id}
                            Searched states: ${result.searchedStates}
                            Time: ${result.timeMs.toFixed(2)}ms`);
          }

          expect(
            result.timedOut,
            `${level.id} timed out after ${result.timeMs.toFixed(2)}ms`,
          ).toBe(false);
          expect(result.solvable, `${level.id} is not solvable`).toBe(true);
        }, 35000);
      });
    });

    describe("Hard Levels", () => {
      hardLevels.forEach((level) => {
        it(`${level.id} (${level.name}) should be solvable`, () => {
          const result = solvePuzzle(level, 60000); // 60s timeout for hard levels

          if (!result.solvable && !result.timedOut) {
            console.log(`Unsolvable: ${level.id}
                            Searched states: ${result.searchedStates}
                            Time: ${result.timeMs.toFixed(2)}ms`);
          }

          expect(
            result.timedOut,
            `${level.id} timed out after ${result.timeMs.toFixed(2)}ms`,
          ).toBe(false);
          expect(result.solvable, `${level.id} is not solvable`).toBe(true);
        }, 65000); // 65s test timeout
      });
    });
  });

  describe("Solution Verification", () => {
    // Test a few key levels to ensure solution quality
    const testLevels = ["easy_1", "med_1", "hard_2"];

    testLevels.forEach((levelId) => {
      const level = presetLevels.find((l) => l.id === levelId);
      if (!level) return;

      it(`${level.id} solution uses all pieces exactly once`, () => {
        const result = solvePuzzle(level, 30000);

        if (!result.solvable || !result.solution) {
          // Skip if unsolvable (will be caught by solvability tests)
          return;
        }

        const pieceIds = result.solution.map((s) => s.pieceId);
        const uniqueIds = new Set(pieceIds);

        // All pieces used
        expect(pieceIds.length).toBe(level.pieces.length);
        // Each piece used exactly once
        expect(uniqueIds.size).toBe(level.pieces.length);
        // All piece IDs match level pieces
        for (const id of pieceIds) {
          expect(level.pieces.some((p) => p.id === id)).toBe(true);
        }
      }, 35000);
    });
  });
});

/**
 * Summary test - provides a quick overview of all levels
 */
describe("Preset Levels Summary", () => {
  it("reports validation status for all levels", () => {
    const results: {
      id: string;
      name: string;
      volumeValid: boolean;
      diff: number;
    }[] = [];

    for (const level of presetLevels) {
      const validation = validateLevelVolume(level);
      results.push({
        id: level.id,
        name: level.name,
        volumeValid: validation.isValid,
        diff: validation.volumeDifference,
      });
    }

    const invalid = results.filter((r) => !r.volumeValid);

    if (invalid.length > 0) {
      console.log("\n=== INVALID LEVELS ===");
      for (const r of invalid) {
        console.log(
          `${r.id}: "${r.name}" - Volume diff: ${r.diff > 0 ? "+" : ""}${r.diff}`,
        );
      }
      console.log("======================\n");
    }

    // This assertion ensures the test suite reports issues
    expect(
      invalid.length,
      `Found ${invalid.length} levels with volume mismatches`,
    ).toBe(0);
  });
});

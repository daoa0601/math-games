import { describe, it, expect } from "vitest";
import { createSeededRandom } from "@math-games/core";

import { difficulties } from "../catalog";
import { substituteAndEvaluate } from "../logic";
import {
  generateEquation,
  getEquationBalanceCatalog,
  getEquationBalancePracticeConfig,
} from "../generator";

describe("generateEquation", () => {
  it.each(difficulties)(
    "produces a solvable, well-formed %s equation for many seeds",
    (difficulty) => {
      for (let i = 0; i < 50; i++) {
        const level = generateEquation(
          createSeededRandom(`eb-${difficulty}-${i}`),
          difficulty,
        );

        // The chosen answer must actually balance the equation.
        expect(substituteAndEvaluate(level, level.answer)).toBe(
          level.rightSide,
        );
        // Right side stays non-negative for young solvers.
        expect(level.rightSide).toBeGreaterThanOrEqual(0);
        // Exactly one unknown.
        expect(level.leftTerms.filter((t) => t === "?")).toHaveLength(1);
        // Four unique, non-negative choices including the answer.
        expect(level.choices).toHaveLength(4);
        expect(new Set(level.choices).size).toBe(4);
        expect(level.choices).toContain(level.answer);
        expect(level.choices.every((c) => c >= 0)).toBe(true);
      }
    },
  );

  it("is deterministic for a given seed", () => {
    const a = generateEquation(createSeededRandom("same-seed"), "hard");
    const b = generateEquation(createSeededRandom("same-seed"), "hard");
    expect(a).toEqual(b);
  });
});

describe("catalog + practice wiring", () => {
  it("includes expert and master levels in the catalog", () => {
    const { configs } = getEquationBalanceCatalog();
    const tiers = new Set(configs.map((c) => c.difficulty));
    expect(tiers.has("expert")).toBe(true);
    expect(tiers.has("master")).toBe(true);
  });

  it("namespaces practice level ids by difficulty and seed", () => {
    const level = getEquationBalancePracticeConfig("My Seed!", "expert");
    expect(level.id).toBe("practice_expert_my-seed");
    expect(substituteAndEvaluate(level, level.answer)).toBe(level.rightSide);
  });
});

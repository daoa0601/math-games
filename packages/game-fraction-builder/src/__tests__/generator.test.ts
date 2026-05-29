import { describe, it, expect } from "vitest";
import { createSeededRandom } from "@math-games/core";

import { difficulties, gcd } from "../catalog";
import type { FractionConfig } from "../catalog";
import { validate } from "../logic";
import {
  generateFraction,
  getFractionBuilderCatalog,
  getFractionBuilderPracticeConfig,
} from "../generator";

/** The completion that should solve a generated level, per mode. */
function canonicalCompletion(level: FractionConfig) {
  const [tn, td] = level.target;
  if (level.mode === "build") {
    return { numerator: tn, denominator: td };
  }
  if (level.mode === "simplify") {
    const g = gcd(tn, td);
    return { numerator: tn / g, denominator: td / g };
  }
  const [cn, cd] = level.compareTo!;
  const left = tn / td;
  const right = cn / cd;
  const compareAnswer =
    left > right ? "left" : left < right ? "right" : "equal";
  return { numerator: 0, denominator: 1, compareAnswer };
}

describe("generateFraction", () => {
  it.each(difficulties)(
    "produces a solvable, well-formed %s level for many seeds",
    (difficulty) => {
      for (let i = 0; i < 50; i++) {
        const level = generateFraction(
          createSeededRandom(`fb-${difficulty}-${i}`),
          difficulty,
        );

        // Solvable: the canonical completion validates.
        expect(validate(level, canonicalCompletion(level)).completed).toBe(
          true,
        );

        const [, td] = level.target;
        expect(td).toBeGreaterThan(0);

        if (level.mode === "compare") {
          expect(level.compareTo).toBeDefined();
        } else {
          // The simplified/target numerator and denominator are pickable.
          const g = gcd(level.target[0], level.target[1]);
          const wantN =
            level.mode === "simplify" ? level.target[0] / g : level.target[0];
          const wantD =
            level.mode === "simplify" ? level.target[1] / g : level.target[1];
          expect(level.choices).toContain(wantN);
          expect(level.choices).toContain(wantD);
        }
      }
    },
  );

  it("is deterministic for a given seed", () => {
    const a = generateFraction(createSeededRandom("same"), "expert");
    const b = generateFraction(createSeededRandom("same"), "expert");
    expect(a).toEqual(b);
  });
});

describe("catalog + practice wiring", () => {
  it("includes expert and master levels in the catalog", () => {
    const tiers = new Set(
      getFractionBuilderCatalog().configs.map((c) => c.difficulty),
    );
    expect(tiers.has("expert")).toBe(true);
    expect(tiers.has("master")).toBe(true);
  });

  it("namespaces practice ids and stays solvable", () => {
    const level = getFractionBuilderPracticeConfig("My Seed!", "master");
    expect(level.id).toBe("practice_master_my-seed");
    expect(validate(level, canonicalCompletion(level)).completed).toBe(true);
  });
});

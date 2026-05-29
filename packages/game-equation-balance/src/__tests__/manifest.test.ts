import { describe, expect, it } from "vitest";

import { catalog } from "../catalog";
import { getEquationBalanceCatalog } from "../generator";
import { buildEquationBalanceManifest } from "../manifest";

describe("buildEquationBalanceManifest", () => {
  it("tags equation-balance skills and structural difficulty features", () => {
    const m = buildEquationBalanceManifest(catalog[0]);

    expect(m.skillTags).toContain("equality_as_invariant");
    expect(m.skillTags).toContain("inverse_operations");
    expect(m.misconceptionTags).toContain("one_sided_operation");
    expect(m.gameId).toBe("equation-balance");
    expect(m.gradeBand).toBe("middle");
    expect(m.generatorVersion).toBeTruthy();
    // eb-easy-add-5 is "? + 3 = 8": one operand, one operator, no coefficient.
    expect(m.difficultyFeatures?.mode).toBe("fill");
    expect(m.difficultyFeatures?.operatorCount).toBe(1);
    expect(m.difficultyFeatures?.operandCount).toBe(1);
    expect(m.difficultyFeatures?.hasMultiplication).toBe(false);
  });

  it("reflects a multiplication coefficient as an extra inverse step", () => {
    const oneStep = catalog.find((c) => c.mode === "one-step");
    expect(oneStep).toBeDefined();
    const m = buildEquationBalanceManifest(oneStep!);
    expect(m.difficultyFeatures?.hasMultiplication).toBe(true);
    expect(m.difficultyFeatures?.hasVariable).toBe(true);
  });
});

describe("equation-balance catalog manifests", () => {
  it("attaches a manifest with skillTags to every catalog config", () => {
    for (const config of getEquationBalanceCatalog().configs) {
      expect(config.manifest?.skillTags).toContain("equality_as_invariant");
      expect(config.manifest?.gameId).toBe("equation-balance");
    }
  });
});

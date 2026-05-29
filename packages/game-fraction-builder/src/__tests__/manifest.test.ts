import { describe, expect, it } from "vitest";

import type { FractionConfig } from "../catalog";
import { getFractionBuilderCatalog } from "../generator";
import { buildFractionBuilderManifest } from "../manifest";

function simplifyLevel(): FractionConfig {
  return {
    id: "tiny",
    difficulty: "medium",
    mode: "simplify",
    target: [4, 8],
    choices: [1, 2, 4, 8],
  };
}

describe("buildFractionBuilderManifest", () => {
  it("tags fraction-builder skills and structural difficulty features", () => {
    const m = buildFractionBuilderManifest(simplifyLevel());

    expect(m.skillTags).toEqual([
      "rational_magnitude",
      "equivalence",
      "decomposition",
    ]);
    expect(m.misconceptionTags).toContain("denominator_size_bias");
    expect(m.gameId).toBe("fraction-builder");
    expect(m.gradeBand).toBe("middle");
    expect(m.difficultyFeatures?.mode).toBe("simplify");
    expect(m.difficultyFeatures?.targetDenominator).toBe(8);
    expect(m.difficultyFeatures?.choiceCount).toBe(4);
    expect(m.difficultyFeatures?.isCompare).toBe(false);
    expect(m.generatorVersion).toBeTruthy();
  });

  it("flags compare levels via isCompare", () => {
    const m = buildFractionBuilderManifest({
      ...simplifyLevel(),
      mode: "compare",
      compareTo: [1, 3],
      choices: [],
    });

    expect(m.difficultyFeatures?.isCompare).toBe(true);
    expect(m.difficultyFeatures?.choiceCount).toBe(0);
  });
});

describe("fraction-builder catalog manifests", () => {
  it("attaches a skill-tagged manifest to every catalog config", () => {
    for (const config of getFractionBuilderCatalog().configs) {
      expect(config.manifest?.skillTags).toContain("rational_magnitude");
      expect(config.manifest?.gameId).toBe("fraction-builder");
    }
  });
});

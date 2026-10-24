import { describe, expect, it } from "vitest";

import { catalog } from "../catalog";
import type { PatternConfig } from "../catalog";
import { buildPatternDetectiveManifest } from "../manifest";

function sample(): PatternConfig {
  return {
    id: "sample",
    difficulty: "easy",
    patternType: "arithmetic",
    sequence: [2, 4, 6, -1, 10],
    missingIndex: 3,
    answer: 8,
    distractors: [7, 9, 12],
  };
}

describe("buildPatternDetectiveManifest", () => {
  it("tags pattern-detective skills and structural difficulty features", () => {
    const m = buildPatternDetectiveManifest(sample());

    expect(m.skillTags).toEqual([
      "functional_thinking",
      "pattern_generalization",
    ]);
    expect(m.gameId).toBe("pattern-detective");
    expect(m.gradeBand).toBe("middle");
    expect(m.difficultyFeatures?.termCount).toBe(5);
    expect(m.difficultyFeatures?.patternType).toBe("arithmetic");
    expect(m.difficultyFeatures?.choiceCount).toBe(4);
    expect(m.generatorVersion).toBeTruthy();
  });

  it("flags a gap at the sequence edge via difficultyFeatures", () => {
    const edge = buildPatternDetectiveManifest({
      ...sample(),
      sequence: [-1, 20, 30, 40, 50],
      missingIndex: 0,
    });
    expect(edge.difficultyFeatures?.missingAtEdge).toBe(true);

    const interior = buildPatternDetectiveManifest(sample());
    expect(interior.difficultyFeatures?.missingAtEdge).toBe(false);
  });
});

describe("catalog manifests", () => {
  it("carries a skill-tagged manifest on every catalog config", () => {
    for (const config of catalog) {
      expect(config.manifest?.skillTags).toContain("functional_thinking");
    }
  });
});

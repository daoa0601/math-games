import { describe, expect, it } from "vitest";

import { getShapeArchitectCatalog } from "../catalog";
import { buildShapeArchitectManifest } from "../manifest";

describe("buildShapeArchitectManifest", () => {
  it("tags spatial-reasoning skills and structural difficulty features", () => {
    const config = getShapeArchitectCatalog().configs[0];
    const m = buildShapeArchitectManifest(config);

    expect(m.skillTags).toContain("spatial_decomposition");
    expect(m.gameId).toBe("shape-architect");
    expect(m.gradeBand).toBe("middle");
    expect(m.difficultyFeatures?.pieceCount).toBe(config.pieces.length);
    expect(m.difficultyFeatures?.cellCount).toBe(config.targetVoxels.length);
    expect(m.difficultyFeatures?.is3D).toBe(config.type === "3D");

    // The solver is expensive (forged into KV); shape-architect's trace is the
    // existing LevelSolution, not an embedded build-time solutionTrace.
    expect(m.solutionTrace).toBeUndefined();
  });

  it("attaches a skill-tagged manifest to every catalog config", () => {
    for (const config of getShapeArchitectCatalog().configs) {
      expect(config.manifest?.skillTags).toContain("spatial_decomposition");
    }
  });
});

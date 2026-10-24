import { describe, expect, it } from "vitest";

import {
  getShapeArchitectCatalog,
  getShapeArchitectPracticeConfig,
} from "../catalog";

describe("Shape Architect catalog", () => {
  it("exposes every preset level to the migrated route", () => {
    const catalog = getShapeArchitectCatalog();

    expect(catalog.configs.length).toBeGreaterThan(13);
    expect(catalog.configs.map((config) => config.id)).toEqual(
      expect.arrayContaining([
        "catalog_easy_starter-fitted-blocks",
        "easy_1",
        "easy_4",
        "med_1",
        "hard_v2_1",
        "expert_2",
      ]),
    );
  });

  it("uses the 4x4 square as the stable default level", () => {
    expect(getShapeArchitectCatalog().initialConfigId).toBe(
      "catalog_easy_starter-fitted-blocks",
    );
  });

  it("keeps each level ready for progress persistence and solving", () => {
    for (const config of getShapeArchitectCatalog().configs) {
      expect(config.id.length).toBeGreaterThan(0);
      expect(config.targetVoxels.length).toBeGreaterThan(0);
      expect(config.pieces.length).toBeGreaterThan(0);
      expect(config.gridSize).toHaveLength(3);
    }
  });

  it("generates deterministic seeded practice levels", () => {
    const config = getShapeArchitectPracticeConfig(" Shape Lab ", "medium");
    const matchingConfig = getShapeArchitectPracticeConfig(
      "shape-lab",
      "medium",
    );

    expect(config.id).toBe("practice_medium_shape-lab");
    expect(config).toEqual(matchingConfig);
    expect(config.name).toMatch(/^Practice: /);
    expect(config.difficulty).toBe("medium");
  });
});

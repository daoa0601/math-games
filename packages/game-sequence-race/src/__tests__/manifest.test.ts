import { describe, expect, it } from "vitest";

import { getSequenceRaceCatalog } from "../catalog";
import type { GameConfig } from "../logic";
import { buildSequenceRaceManifest } from "../manifest";
import { sequenceRaceModule } from "../module";

function tinyRace(): GameConfig {
  return {
    id: "tiny",
    name: "Tiny",
    target: 10,
    stepPool: [1, 2, 3, 4],
    difficulty: "easy",
    sequenceType: "arithmetic",
    aiMovesFirst: true,
  };
}

describe("buildSequenceRaceManifest", () => {
  it("tags sequence-race skills and structural difficulty features", () => {
    const m = buildSequenceRaceManifest(tinyRace());

    expect(m.skillTags).toEqual(["functional_thinking", "explicit_rule"]);
    expect(m.misconceptionTags).toEqual(["overfits_few_terms"]);
    expect(m.gameId).toBe("sequence-race");
    expect(m.gradeBand).toBe("middle");
    expect(m.generatorVersion).toBeTruthy();
    expect(m.difficultyFeatures?.stepPoolSize).toBe(4);
    expect(m.difficultyFeatures?.target).toBe(10);
    expect(m.difficultyFeatures?.maxStep).toBe(4);
    expect(m.difficultyFeatures?.sequenceType).toBe("arithmetic");
    expect(m.difficultyFeatures?.aiMovesFirst).toBe(true);
  });

  it("attaches a skill-tagged manifest to every catalog config", () => {
    for (const config of getSequenceRaceCatalog().configs) {
      expect(config.manifest?.skillTags).toContain("functional_thinking");
    }
  });
});

describe("resolveLevelConfig (server-side)", () => {
  it("returns preset configs WITH a manifest, like getCatalog", () => {
    const id = getSequenceRaceCatalog().configs[0].id;
    const resolved = sequenceRaceModule.resolveLevelConfig(id);

    // The scoring pipeline + attempt logging read the manifest off
    // resolveLevelConfig, so it must carry it (not the raw preset array).
    expect(resolved?.manifest?.skillTags).toContain("functional_thinking");
  });
});

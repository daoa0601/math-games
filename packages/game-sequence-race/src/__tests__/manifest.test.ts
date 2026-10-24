import { describe, expect, it } from "vitest";

import { getSequenceRaceCatalog } from "../catalog";
import { applyMove, createGameState } from "../logic";
import type { GameConfig } from "../logic";
import {
  buildSequenceRaceManifest,
  deriveSequenceRaceTrace,
} from "../manifest";
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

describe("deriveSolutionTrace", () => {
  it("emits a keyed optimal-play line that replays to game over", () => {
    const config = tinyRace();
    const trace = deriveSequenceRaceTrace(config);

    expect(trace.length).toBeGreaterThan(0);
    expect(trace[0]?.labelKey).toBe("trace.optimalMove");

    // Replay the trace: each step must be a valid move, ending at game over.
    let state = createGameState(config);
    for (const step of trace) {
      const stepValue = step.data?.["step"];
      expect(typeof stepValue).toBe("number");
      const before = state;
      state = applyMove(state, stepValue as number);
      expect(state).not.toBe(before); // move was valid (state advanced)
    }
    expect(state.gameOver).toBe(true);
  });

  it("includes the trace in the built manifest", () => {
    const m = buildSequenceRaceManifest(tinyRace());
    expect(m.solutionTrace?.length ?? 0).toBeGreaterThan(0);
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

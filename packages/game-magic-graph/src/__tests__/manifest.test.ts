import { describe, expect, it } from "vitest";

import { getMagicGraphCatalog } from "../catalog";
import { isPuzzleSolved } from "../logic";
import type { PuzzleConfig } from "../logic";
import { buildMagicGraphManifest, deriveSolutionTrace } from "../manifest";

function tinyLine(): PuzzleConfig {
  return {
    id: "tiny",
    name: "Tiny",
    nodes: [
      { id: "a", position: { x: 0, y: 0 }, value: null, isFixed: false },
      { id: "b", position: { x: 1, y: 0 }, value: null, isFixed: false },
    ],
    lines: [{ id: "l1", nodeIds: ["a", "b"] }],
    targetSum: 7,
    availableNumbers: [3, 4],
    difficulty: "easy",
  };
}

describe("deriveSolutionTrace", () => {
  it("emits keyed place-then-force steps from the solver's answer", () => {
    const trace = deriveSolutionTrace(tinyLine());

    expect(trace).toHaveLength(2);
    expect(trace[0]).toMatchObject({
      labelKey: "trace.placeValue",
      params: { node: "a", value: 3 },
    });
    expect(trace[1]).toMatchObject({
      labelKey: "trace.forcedCell",
      params: { node: "b", value: 4 },
    });
  });

  it("returns no trace for an unsolvable puzzle", () => {
    const t = tinyLine();
    expect(
      deriveSolutionTrace({ ...t, targetSum: 100, isSolvable: false }),
    ).toEqual([]);
  });
});

describe("buildMagicGraphManifest", () => {
  it("tags magic-graph skills and structural difficulty features", () => {
    const m = buildMagicGraphManifest(tinyLine());

    expect(m.skillTags).toContain("constraint_propagation");
    expect(m.gameId).toBe("magic-graph");
    expect(m.gradeBand).toBe("middle");
    expect(m.difficultyFeatures?.lineCount).toBe(1);
    expect(m.generatorVersion).toBeTruthy();
  });

  it("derives a solutionTrace that actually solves every catalog preset", () => {
    for (const config of getMagicGraphCatalog().configs) {
      const trace = config.manifest?.solutionTrace ?? [];
      expect(trace.length).toBeGreaterThan(0);

      const valueMap = new Map<string, number | null>();
      for (const node of config.nodes) {
        if (node.isFixed) valueMap.set(node.id, node.value);
      }
      for (const step of trace) {
        const nodeId = step.data?.["nodeId"];
        const value = step.data?.["value"];
        if (typeof nodeId === "string" && typeof value === "number") {
          valueMap.set(nodeId, value);
        }
      }

      expect(isPuzzleSolved(config.lines, valueMap, config.targetSum)).toBe(
        true,
      );
    }
  });
});

import { describe, expect, it } from "vitest";

import { toClientCatalog, toClientManifest } from "../level-manifest";
import type { LevelManifest } from "../level-manifest";

const serverManifest: LevelManifest = {
  skillTags: ["constraint_propagation"],
  difficultyFeatures: { lineCount: 3 },
  solutionTrace: [
    { labelKey: "trace.forcedCell", params: { node: "n1", value: 7 } },
  ],
  hintPath: [{ labelKey: "hint.start", level: 1 }],
};

describe("toClientManifest", () => {
  it("drops the SERVER-ONLY solutionTrace and hintPath", () => {
    const client = toClientManifest(serverManifest);
    expect(client.solutionTrace).toBeUndefined();
    expect(client.hintPath).toBeUndefined();
  });

  it("preserves the client-safe fields", () => {
    const client = toClientManifest(serverManifest);
    expect(client.skillTags).toEqual(["constraint_propagation"]);
    expect(client.difficultyFeatures).toEqual({ lineCount: 3 });
  });

  it("does not mutate its input", () => {
    toClientManifest(serverManifest);
    expect(serverManifest.solutionTrace).toBeDefined();
  });
});

type Cfg = { id: string; difficulty: string; manifest?: LevelManifest };

describe("toClientCatalog", () => {
  it("strips solutions from config and every configs entry", () => {
    const a: Cfg = { id: "a", difficulty: "easy", manifest: serverManifest };
    const b: Cfg = {
      id: "b",
      difficulty: "hard",
      manifest: { skillTags: ["x"] },
    };

    const client = toClientCatalog({
      config: a,
      configs: [a, b],
      initialConfigId: "a",
    });

    expect(client.config.manifest?.solutionTrace).toBeUndefined();
    expect(client.config.manifest?.hintPath).toBeUndefined();
    expect(client.configs[0].manifest?.solutionTrace).toBeUndefined();
    expect(client.configs[0].manifest?.skillTags).toEqual([
      "constraint_propagation",
    ]);
    expect(client.configs[1].manifest?.skillTags).toEqual(["x"]);
    expect(client.initialConfigId).toBe("a");
  });

  it("leaves manifest-less configs untouched", () => {
    const a: Cfg = { id: "a", difficulty: "easy" };
    const client = toClientCatalog({
      config: a,
      configs: [a],
      initialConfigId: "a",
    });
    expect(client.config.manifest).toBeUndefined();
  });
});

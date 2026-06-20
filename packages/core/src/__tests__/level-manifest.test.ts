import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { createGameModule } from "../game-module";
import { buildAttemptDiagnostics } from "../index";
import type {
  AttemptDiagnostics,
  GradeBandType,
  HintStep,
  LevelManifest,
  SolutionStep,
} from "../index";

describe("LevelManifest contract", () => {
  it("requires only skillTags; provenance and diagnostics are optional", () => {
    const minimal: LevelManifest = { skillTags: ["fraction_equivalence"] };

    expect(minimal.skillTags).toEqual(["fraction_equivalence"]);
    expect(minimal.solutionTrace).toBeUndefined();
    expect(minimal.misconceptionTags).toBeUndefined();
  });

  it("carries a keyed (localizable) solution trace and hint path — never raw strings", () => {
    const step: SolutionStep = {
      labelKey: "mg.trace.fill_forced_cell",
      params: { cell: "A1", value: 7 },
      data: { row: 0, col: 0 },
    };
    const hint: HintStep = { labelKey: "mg.hint.most_constrained", level: 1 };
    const gradeBand: GradeBandType = "middle";

    const full: LevelManifest = {
      gameId: "magic-graph",
      seed: "mg-demo-1",
      generatorVersion: "2026.05.1",
      gradeBand,
      skillTags: ["constraint_propagation", "additive_structure"],
      misconceptionTags: ["ignores_overlapping_line"],
      difficultyFeatures: {
        lineCount: 3,
        hasParityConstraint: true,
        sum: "15",
      },
      solutionTrace: [step],
      hintPath: [hint],
    };

    // Trace/hint steps are i18n keys + params, so item logic stays string-free.
    expect(full.solutionTrace?.[0]?.labelKey).toBe("mg.trace.fill_forced_cell");
    expect(full.solutionTrace?.[0]?.params).toEqual({ cell: "A1", value: 7 });
    expect(full.hintPath?.[0]?.level).toBe(1);
    expect(full.gradeBand).toBe("middle");
  });

  it("attaches to a level config and round-trips through the GameModule contract", async () => {
    type DemoConfig = {
      id: string;
      difficulty: string;
      manifest?: LevelManifest;
    };

    const level: DemoConfig = {
      id: "demo-1",
      difficulty: "easy",
      manifest: { skillTags: ["demo_skill"] },
    };

    const module = createGameModule({
      id: "demo",
      route: "/games/demo",
      title: "Demo",
      description: "Demo",
      difficulties: ["easy"],
      achievements: [],
      translations: { en: {}, vi: {} },
      completionSchema: Schema.Unknown,
      computeScore: () => 0,
      catalog: [level],
      validate: () => ({ completed: true, moves: 1 }),
    });

    expect(module.resolveLevelConfig("demo-1")?.manifest?.skillTags).toEqual([
      "demo_skill",
    ]);
    expect(module.getCatalog().config.manifest?.skillTags).toEqual([
      "demo_skill",
    ]);
    await expect(
      Effect.runPromise(module.validateAndComputeScore("demo-1", {})),
    ).resolves.toMatchObject({
      manifest: { skillTags: ["demo_skill"] },
    });
  });
});

describe("buildAttemptDiagnostics", () => {
  it("returns null when the level has no manifest", () => {
    expect(buildAttemptDiagnostics(undefined)).toBeNull();
  });

  it("projects only the diagnostic tags; omits absent optional fields", () => {
    const diagnostics = buildAttemptDiagnostics({
      skillTags: ["constraint_propagation"],
    });

    expect(diagnostics).toEqual({ skillTags: ["constraint_propagation"] });
    // Absent optional fields are omitted, not present-as-undefined, so the
    // persisted JSON stays minimal.
    expect(diagnostics && "misconceptionTags" in diagnostics).toBe(false);
    expect(diagnostics && "difficultyFeatures" in diagnostics).toBe(false);
  });

  it("carries skill, misconception, and difficulty signals when present", () => {
    const diagnostics = buildAttemptDiagnostics({
      skillTags: ["constraint_propagation", "additive_structure"],
      misconceptionTags: ["ignores_overlapping_line"],
      difficultyFeatures: { lineCount: 3, hasParityConstraint: true },
    });

    expect(diagnostics).toEqual({
      skillTags: ["constraint_propagation", "additive_structure"],
      misconceptionTags: ["ignores_overlapping_line"],
      difficultyFeatures: { lineCount: 3, hasParityConstraint: true },
    });
  });

  it("never leaks the answer-bearing solutionTrace / hintPath into an attempt row", () => {
    const step: SolutionStep = { labelKey: "mg.trace.fill_forced_cell" };
    const hint: HintStep = { labelKey: "mg.hint.most_constrained", level: 1 };

    const diagnostics = buildAttemptDiagnostics({
      skillTags: ["constraint_propagation"],
      solutionTrace: [step],
      hintPath: [hint],
    });

    expect(diagnostics).toEqual({ skillTags: ["constraint_propagation"] });
    expect(diagnostics && "solutionTrace" in diagnostics).toBe(false);
    expect(diagnostics && "hintPath" in diagnostics).toBe(false);
  });

  it("satisfies the AttemptDiagnostics shape", () => {
    const diagnostics: AttemptDiagnostics | null = buildAttemptDiagnostics({
      skillTags: ["demo_skill"],
    });

    expect(diagnostics?.skillTags).toEqual(["demo_skill"]);
  });
});

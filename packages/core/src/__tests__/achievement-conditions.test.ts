import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { createGameModule } from "../game-module";
import type { AchievementContext } from "../index";

// Exercises core's declarative `unlockWhen` engine (evaluateAchievementsByCondition)
// through a synthetic module, focusing on the skill-aware predicate added in 4b:
// an achievement may gate on a skill the level exercises (manifest skillTags,
// threaded into the AchievementContext).
function demoModule() {
  return createGameModule({
    id: "demo",
    route: "/games/demo",
    title: "Demo",
    description: "Demo",
    difficulties: ["easy", "hard"],
    translations: { en: {}, vi: {} },
    completionSchema: Schema.Unknown,
    computeScore: () => 0,
    catalog: [{ id: "d1", difficulty: "easy" }],
    validate: () => ({ completed: true, moves: 1 }),
    achievements: [
      {
        id: "completed_only",
        category: "demo",
        name: "Completed",
        description: "Complete a level.",
        rarity: "common",
        unlockWhen: { completed: true },
      },
      {
        id: "skill_invariant",
        category: "demo",
        name: "Invariant",
        description: "Exercise the invariant skill.",
        rarity: "rare",
        unlockWhen: { skillTag: "equality_as_invariant" },
      },
      {
        id: "skill_hard_inverse",
        category: "demo",
        name: "Hard Inverse",
        description: "Solve a hard level exercising inverse operations.",
        rarity: "epic",
        unlockWhen: {
          completed: true,
          difficulty: "hard",
          skillTag: "inverse_operations",
        },
      },
    ],
  });
}

describe("declarative achievements — skillTag predicate", () => {
  const module = demoModule();
  const evaluate = (ctx: AchievementContext) =>
    module.evaluateAchievements(ctx, new Set());

  it("unlocks a skill-gated achievement when skillTags include the required tag", () => {
    const unlocked = evaluate({
      gameId: "demo",
      completed: false,
      skillTags: ["equality_as_invariant"],
    });

    expect(unlocked).toContain("skill_invariant");
  });

  it("does not unlock a skill-gated achievement when the context has no skillTags", () => {
    const unlocked = evaluate({ gameId: "demo", completed: false });

    expect(unlocked).not.toContain("skill_invariant");
  });

  it("does not unlock when skillTags omit the required tag", () => {
    const unlocked = evaluate({
      gameId: "demo",
      completed: false,
      skillTags: ["some_other_skill"],
    });

    expect(unlocked).not.toContain("skill_invariant");
  });

  it("leaves non-skill conditions unaffected by the presence of skillTags", () => {
    const unlocked = evaluate({
      gameId: "demo",
      completed: true,
      skillTags: ["unrelated"],
    });

    expect(unlocked).toContain("completed_only");
  });

  it("AND-composes skillTag with completed and difficulty", () => {
    expect(
      evaluate({
        gameId: "demo",
        completed: true,
        difficulty: "hard",
        skillTags: ["inverse_operations"],
      }),
    ).toContain("skill_hard_inverse");

    // completed + hard but missing the skill → no unlock.
    expect(
      evaluate({
        gameId: "demo",
        completed: true,
        difficulty: "hard",
        skillTags: ["equality_as_invariant"],
      }),
    ).not.toContain("skill_hard_inverse");
  });
});

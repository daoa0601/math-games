import { describe, it, expect } from "vitest";
import { presetGames } from "../presets";
import { validateGameFairness } from "../engine";

describe("SequenceRace Preset Validation", () => {
  describe("all presets should be player-winnable", () => {
    presetGames.forEach((preset) => {
      it(`${preset.id}: ${preset.name} should be winnable by player`, () => {
        const fairness = validateGameFairness(preset);

        // Game theory for two-player zero-sum games:
        // - isPlayerWinnable: player wins when player goes FIRST
        // - isAIWinnable: AI wins when AI goes FIRST
        //
        // If isAIWinnable = false, AI LOSES when going first → player wins going SECOND
        // So player can win going second when !isAIWinnable
        const canWinGoingFirst = fairness.isPlayerWinnable;
        const canWinGoingSecond = !fairness.isAIWinnable; // AI loses first = player wins second
        const hasAiMovesFirst = preset.aiMovesFirst === true;

        // Player can win if:
        // 1. Player wins going first (and aiMovesFirst is not set), OR
        // 2. Player wins going second (and aiMovesFirst IS set)
        const isWinnable =
          (canWinGoingFirst && !hasAiMovesFirst) ||
          (canWinGoingSecond && hasAiMovesFirst);

        // Also determine what needs to be fixed
        const needsAiMovesFirst =
          !canWinGoingFirst && canWinGoingSecond && !hasAiMovesFirst;

        expect(
          isWinnable,
          `
          Preset "${preset.name}" is not correctly configured!
          - Player wins going first: ${canWinGoingFirst}
          - Player wins going second: ${canWinGoingSecond}
          - aiMovesFirst set: ${hasAiMovesFirst}
          ${needsAiMovesFirst ? "→ Add aiMovesFirst: true to fix" : ""}
          ${!canWinGoingFirst && !canWinGoingSecond ? "→ This game is truly unwinnable - redesign needed" : ""}
        `,
        ).toBe(true);
      });
    });
  });

  describe("fairness consistency", () => {
    it("no preset should require an aiMovesFirst fix", () => {
      const needsFix: string[] = [];

      for (const preset of presetGames) {
        const fairness = validateGameFairness(preset);
        const canWinFirst = fairness.isPlayerWinnable;
        const canWinSecond = !fairness.isAIWinnable;
        const hasIt = preset.aiMovesFirst === true;

        if (!canWinFirst && canWinSecond && !hasIt) {
          needsFix.push(`${preset.id}: ${preset.name}`);
        }
      }

      expect(needsFix).toEqual([]);
    });

    it("no preset should be truly unwinnable", () => {
      const unwinnable: string[] = [];

      for (const preset of presetGames) {
        const fairness = validateGameFairness(preset);
        if (!fairness.isPlayerWinnable && fairness.isAIWinnable) {
          unwinnable.push(`${preset.id}: ${preset.name}`);
        }
      }

      expect(unwinnable).toEqual([]);
    });
  });
});

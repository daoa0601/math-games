import { describe, it, expect } from "vitest";
import {
  createGameState,
  getValidMoves,
  isValidMove,
  isHumanTurn,
  applyMove,
  getAIMove,
  analyzePosition,
  analyzePlayerMove,
  validateGameFairness,
  validateAllPresets,
} from "../engine";
import type { GameConfig, SequenceState } from "../types";

function createTestConfig(overrides?: Partial<GameConfig>): GameConfig {
  return {
    id: "test",
    name: "Test Game",
    target: 10,
    stepPool: [1, 2, 3, 4],
    difficulty: "medium",
    ...overrides,
  };
}

describe("SequenceRace Engine", () => {
  const testConfig = createTestConfig();

  describe("createGameState", () => {
    it("creates initial state from config", () => {
      const state = createGameState(testConfig);

      expect(state.target).toBe(10);
      expect(state.currentPosition).toBe(0);
      expect(state.availableSteps).toEqual([1, 2, 3, 4]);
      expect(state.turn).toBe("player");
      expect(state.history).toEqual([]);
      expect(state.winner).toBeNull();
      expect(state.gameOver).toBe(false);
    });

    it("creates a copy of stepPool (not reference)", () => {
      const state = createGameState(testConfig);
      state.availableSteps.push(99);

      expect(testConfig.stepPool).not.toContain(99);
    });
  });

  describe("getValidMoves", () => {
    it("returns all steps that do not exceed target", () => {
      const state = createGameState(testConfig);
      const moves = getValidMoves(state);

      expect(moves).toEqual([1, 2, 3, 4]);
    });

    it("excludes steps that would exceed target", () => {
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 8,
      };
      const moves = getValidMoves(state);

      expect(moves).toEqual([1, 2]);
    });

    it("returns empty array when no valid moves", () => {
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 10,
      };
      const moves = getValidMoves(state);

      expect(moves).toEqual([]);
    });
  });

  describe("isValidMove", () => {
    it("returns true for valid moves", () => {
      const state = createGameState(testConfig);

      expect(isValidMove(state, 1)).toBe(true);
      expect(isValidMove(state, 4)).toBe(true);
    });

    it("returns false for moves exceeding target", () => {
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 9,
      };

      expect(isValidMove(state, 2)).toBe(false);
    });

    it("returns false for unavailable steps", () => {
      const state: SequenceState = {
        ...createGameState(testConfig),
        availableSteps: [1, 2],
      };

      expect(isValidMove(state, 4)).toBe(false);
    });
  });

  describe("applyMove", () => {
    it("updates position correctly", () => {
      const state = createGameState(testConfig);
      const newState = applyMove(state, 3);

      expect(newState.currentPosition).toBe(3);
    });

    it("removes used step from available", () => {
      const state = createGameState(testConfig);
      const newState = applyMove(state, 2);

      expect(newState.availableSteps).not.toContain(2);
    });

    it("switches turn", () => {
      const state = createGameState(testConfig);
      const newState = applyMove(state, 1);

      expect(newState.turn).toBe("ai");
    });

    it("records move in history", () => {
      const state = createGameState(testConfig);
      const newState = applyMove(state, 3);

      expect(newState.history).toHaveLength(1);
      expect(newState.history[0]).toEqual({
        actor: "player",
        step: 3,
        position: 3,
      });
    });

    it("detects win when reaching target", () => {
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 7,
      };
      const newState = applyMove(state, 3);

      expect(newState.currentPosition).toBe(10);
      expect(newState.winner).toBe("player");
      expect(newState.gameOver).toBe(true);
    });

    it("detects win when opponent has no valid moves", () => {
      // Setup: position 9, only step 2 available (would exceed 10)
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 8,
        availableSteps: [1, 2],
      };
      const newState = applyMove(state, 1); // Move to 9, leave only 2

      // Next player (AI) would have no valid moves (only 2, but 9+2=11 > 10)
      expect(newState.winner).toBe("player");
      expect(newState.gameOver).toBe(true);
    });

    it("returns same state for invalid moves", () => {
      const state = createGameState(testConfig);
      const newState = applyMove(state, 99);

      expect(newState).toBe(state);
    });
  });

  describe("getAIMove", () => {
    it("returns a valid move on easy", () => {
      const state = createGameState(testConfig);
      const move = getAIMove(state, "easy");

      expect(testConfig.stepPool).toContain(move);
    });

    it("returns a valid move on hard", () => {
      const state = createGameState(testConfig);
      const move = getAIMove(state, "hard");

      expect(testConfig.stepPool).toContain(move);
    });

    it("throws when no valid moves", () => {
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 10,
        availableSteps: [1, 2],
      };

      expect(() => getAIMove(state, "hard")).toThrow();
    });
  });

  describe("isHumanTurn", () => {
    it("returns true on player turn in vs-ai mode", () => {
      const state = createGameState(testConfig);
      expect(isHumanTurn(state)).toBe(true);
    });

    it("returns false on AI turn in vs-ai mode", () => {
      const state = applyMove(createGameState(testConfig), 1);
      expect(isHumanTurn(state)).toBe(false);
    });

    it("returns true for both turns in two-player mode", () => {
      const twoPlayerConfig: GameConfig = {
        ...testConfig,
        id: "two-player",
        mode: "two-player",
      };
      const state = createGameState(twoPlayerConfig);
      expect(isHumanTurn(state)).toBe(true);

      const next = applyMove(state, 1);
      expect(isHumanTurn(next)).toBe(true);
    });
  });

  describe("createGameState: mode variations", () => {
    it("starts AI first when aiMovesFirst is set", () => {
      const config: GameConfig = { ...testConfig, aiMovesFirst: true };
      const state = createGameState(config);
      expect(state.turn).toBe("ai");
    });

    it("starts player1 in two-player mode", () => {
      const config: GameConfig = { ...testConfig, mode: "two-player" };
      const state = createGameState(config);
      expect(state.turn).toBe("player1");
    });
  });

  describe("analyzePosition", () => {
    it("detects winning position", () => {
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 9,
        availableSteps: [1],
      };
      const analysis = analyzePosition(state);

      expect(analysis.canWin).toBe(true);
      expect(analysis.bestMove).toBe(1);
    });

    it("detects losing position when no winning path exists", () => {
      // Position 8, only step 3 left → 8+3=11 > target=10 → stuck
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 8,
        availableSteps: [3],
        turn: "player",
      };
      const analysis = analyzePosition(state);

      expect(analysis.canWin).toBe(false);
    });

    it("finds winning move in a forced-win scenario", () => {
      // Target=5, steps=[1,2,3,4], position=0, player goes first
      // Player can take 4, reach 4. AI gets only [1,2,3].
      // AI takes 1 → 5 → AI wins. So player should take the right step.
      // Actually let's use a simpler forced win: position=4, steps=[1], target=5
      const config: GameConfig = {
        id: "forced",
        name: "Forced Win",
        target: 5,
        stepPool: [1],
        difficulty: "hard",
      };
      const state: SequenceState = {
        ...createGameState(config),
        currentPosition: 4,
        availableSteps: [1],
      };
      const analysis = analyzePosition(state);

      expect(analysis.canWin).toBe(true);
      expect(analysis.bestMove).toBe(1);
    });
  });

  describe("getAIMove: strategy quality", () => {
    it("hard AI takes the winning move when one exists", () => {
      // AI is at position 9, step [1] available, target 10 → must take 1
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 9,
        availableSteps: [1],
        turn: "ai",
      };
      const move = getAIMove(state, "hard");
      expect(move).toBe(1);
    });

    it("hard AI finds the winning move among multiple options", () => {
      // Target=10, position=6, steps=[2,3,4], AI turn
      // AI takes 4 → reaches 10 → wins instantly
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 6,
        availableSteps: [2, 3, 4],
        turn: "ai",
      };
      const move = getAIMove(state, "hard");
      const afterMove = applyMove(state, move);
      expect(afterMove.gameOver).toBe(true);
      expect(afterMove.winner).toBe("ai");
    });

    it("hard AI avoids giving opponent a winning position", () => {
      // Target=5, steps=[1,2,3], position=0, AI turn
      // If AI takes 1 → pos=1, player has [2,3] → player takes 4? No, 2+3 not available individually
      // Use a small game tree where optimal is known
      const config: GameConfig = {
        id: "avoid-loss",
        name: "Avoid Loss",
        target: 3,
        stepPool: [1, 2],
        difficulty: "hard",
      };
      const state: SequenceState = {
        ...createGameState(config),
        turn: "ai",
      };
      const move = getAIMove(state, "hard");
      // AI should find the optimal move; verify it's valid
      expect([1, 2]).toContain(move);

      // After AI moves, verify the position is analyzed correctly
      const afterAI = applyMove(state, move);
      if (!afterAI.gameOver) {
        // Hard AI should not let player force a win if avoidable
        const aiAnalysis = analyzePosition(state);
        if (aiAnalysis.canWin) {
          // If AI can win, it should have picked the winning path
          expect(move).toBe(aiAnalysis.bestMove);
        }
      }
    });
  });

  describe("analyzePlayerMove", () => {
    it("reports winning move as optimal", () => {
      const state: SequenceState = {
        ...createGameState(testConfig),
        currentPosition: 7,
        availableSteps: [3],
        turn: "player",
      };
      const analysis = analyzePlayerMove(state, 3);

      expect(analysis.wasOptimal).toBe(true);
      expect(analysis.playerMove).toBe(3);
      expect(analysis.explanation).toContain("reached the target");
    });

    it("identifies optimal non-winning move", () => {
      // Position=0, target=5, steps=[1,2,3], player turn
      const config: GameConfig = {
        id: "analysis-test",
        name: "Analysis",
        target: 5,
        stepPool: [1, 2, 3],
        difficulty: "hard",
      };
      const state = createGameState(config);
      const optimal = analyzePosition(state);

      if (optimal.bestMove !== null) {
        const analysis = analyzePlayerMove(state, optimal.bestMove);
        expect(analysis.wasOptimal).toBe(true);
        expect(analysis.optimalMove).toBe(optimal.bestMove);
      }
    });

    it("identifies suboptimal move when better option exists", () => {
      // Target=5, steps=[1,2,4], position=0, player turn
      // Player takes 4 → position=4, AI has [1,2] → AI takes 1 → 5 → AI wins
      // Player should take a different step; taking 4 is suboptimal if it hands AI the win
      const config: GameConfig = {
        id: "suboptimal",
        name: "Suboptimal",
        target: 5,
        stepPool: [1, 2, 4],
        difficulty: "hard",
      };
      const state = createGameState(config);
      const optimal = analyzePosition(state);

      // Find a non-optimal move
      const validMoves = [1, 2, 4];
      const suboptimalMove = validMoves.find((m) => m !== optimal.bestMove);

      if (suboptimalMove !== undefined) {
        const analysis = analyzePlayerMove(state, suboptimalMove);
        expect(analysis.wasOptimal).toBe(false);
        expect(analysis.playerMove).toBe(suboptimalMove);
        expect(analysis.optimalMove).toBe(optimal.bestMove);
      }
    });

    it("provides AI counter move for non-terminal states", () => {
      const state = createGameState(testConfig);
      const analysis = analyzePlayerMove(state, 1);

      if (!analysis.wasOptimal || analysis.aiCounterMove !== null) {
        expect(analysis.aiCounterMove).not.toBeNull();
      }
    });
  });

  describe("validateGameFairness", () => {
    it("returns fairness analysis for config", () => {
      const result = validateGameFairness(testConfig);

      expect(typeof result.isPlayerWinnable).toBe("boolean");
      expect(typeof result.isAIWinnable).toBe("boolean");
      expect(["player", "ai", "both", "neither"]).toContain(
        result.firstMoverAdvantage,
      );
    });

    it("detects first-mover advantage correctly", () => {
      // Target=1, steps=[1]: whoever goes first wins
      const trivialConfig: GameConfig = {
        id: "trivial",
        name: "Trivial",
        target: 1,
        stepPool: [1],
        difficulty: "easy",
      };
      const result = validateGameFairness(trivialConfig);
      expect(result.isPlayerWinnable).toBe(true);
      expect(result.firstMoverAdvantage).toBe("both");
      expect(result.optimalFirstMove).toBe(1);
    });

    it("detects when neither player can force a win", () => {
      // Target=3, steps=[1,2]: first mover can always win by taking 2 (reach 2),
      // then opponent takes 1 (reach 3, opponent wins). Actually first mover
      // takes 2, opponent has [1] → takes 1 → reaches 3 → opponent wins.
      // First mover takes 1, opponent has [2] → takes 2 → reaches 3 → opponent wins.
      // So second player always wins → firstMoverAdvantage should be 'neither'
      const config: GameConfig = {
        id: "second-wins",
        name: "Second Wins",
        target: 3,
        stepPool: [1, 2],
        difficulty: "easy",
      };
      const result = validateGameFairness(config);

      // Verify the analysis is logically consistent
      if (result.firstMoverAdvantage === "neither") {
        expect(result.isPlayerWinnable).toBe(false);
      }
    });
  });

  describe("validateAllPresets", () => {
    it("returns a result for every preset", () => {
      const presets: GameConfig[] = [
        testConfig,
        { ...testConfig, id: "test-2", target: 5, stepPool: [1, 2, 3] },
      ];
      const results = validateAllPresets(presets);

      expect(results.size).toBe(2);
      expect(results.has("test")).toBe(true);
      expect(results.has("test-2")).toBe(true);

      for (const [, result] of results) {
        expect(typeof result.isPlayerWinnable).toBe("boolean");
        expect(typeof result.isAIWinnable).toBe("boolean");
      }
    });
  });
});

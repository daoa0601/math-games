// ========================================
// Sequence Sprinter - Game Engine
// ========================================

import type {
  SequenceState,
  HistoryEntry,
  GameConfig,
  GameMode,
} from "./types";

/**
 * Create initial game state from config
 */
export function createGameState(config: GameConfig): SequenceState {
  const mode = config.mode ?? "vs-ai";

  // Determine starting turn
  let startingTurn: SequenceState["turn"];
  if (mode === "two-player") {
    startingTurn = "player1";
  } else if (config.aiMovesFirst) {
    // AI moves first - player gets second-mover advantage
    startingTurn = "ai";
  } else {
    startingTurn = "player";
  }

  return {
    target: config.target,
    currentPosition: 0,
    availableSteps: [...config.stepPool],
    turn: startingTurn,
    history: [],
    winner: null,
    gameOver: false,
    mode,
  };
}

/**
 * Get valid moves from current state
 */
export function getValidMoves(state: SequenceState): number[] {
  return state.availableSteps.filter(
    (step) => state.currentPosition + step <= state.target,
  );
}

/**
 * Check if a move is valid
 */
export function isValidMove(state: SequenceState, step: number): boolean {
  return (
    state.availableSteps.includes(step) &&
    state.currentPosition + step <= state.target
  );
}

/**
 * Get the next turn based on current turn and game mode
 */
function getNextTurn(
  currentTurn: SequenceState["turn"],
  mode: GameMode,
): SequenceState["turn"] {
  if (mode === "two-player") {
    return currentTurn === "player1" ? "player2" : "player1";
  }
  // vs-ai mode
  return currentTurn === "player" ? "ai" : "player";
}

/**
 * Check if the current turn is a human player (for UI logic)
 */
export function isHumanTurn(state: SequenceState): boolean {
  if (state.mode === "two-player") {
    return true; // Both turns are human in two-player
  }
  return state.turn === "player";
}

/**
 * Apply a move and return new state
 */
export function applyMove(state: SequenceState, step: number): SequenceState {
  if (!isValidMove(state, step)) {
    return state;
  }

  const newPosition = state.currentPosition + step;
  const newAvailable = state.availableSteps.filter((s) => s !== step);

  const entry: HistoryEntry = {
    actor: state.turn,
    step,
    position: newPosition,
  };

  // Check win condition
  const isWin = newPosition === state.target;

  // Get next turn based on mode
  const nextTurn = getNextTurn(state.turn, state.mode);
  const nextState: SequenceState = {
    ...state,
    currentPosition: newPosition,
    availableSteps: newAvailable,
    turn: nextTurn,
    history: [...state.history, entry],
    winner: isWin ? state.turn : null,
    gameOver: isWin,
  };

  // If winner, game is over
  if (isWin) {
    return nextState;
  }

  // Check if next player is stuck (no valid moves)
  const nextValidMoves = getValidMoves(nextState);
  if (nextValidMoves.length === 0) {
    // Current player wins because opponent is stuck
    return {
      ...nextState,
      winner: state.turn,
      gameOver: true,
    };
  }

  return nextState;
}

// ========================================
// Minimax AI with Depth Limit
// ========================================

interface MinimaxResult {
  score: number;
  move: number | null;
}

// Depth limits by difficulty (prevents UI blocking on large step pools)
const DEPTH_LIMITS: Record<"easy" | "medium" | "hard", number> = {
  easy: 6,
  medium: 10,
  hard: 20, // Effectively unlimited for most puzzles
};

/**
 * Heuristic evaluation when depth limit is reached.
 * Estimates winning probability based on position and remaining moves.
 */
function heuristicEval(state: SequenceState, isMaximizing: boolean): number {
  const distanceToTarget = state.target - state.currentPosition;
  const avgStep =
    state.availableSteps.length > 0
      ? state.availableSteps.reduce((a, b) => a + b, 0) /
        state.availableSteps.length
      : 1;

  // Estimate: closer to target with more moves = better position
  const movesNeeded = distanceToTarget / avgStep;
  const movesAvailable = state.availableSteps.filter(
    (s) => state.currentPosition + s <= state.target,
  ).length;

  // Score based on position advantage
  // Being close to winning is good for current player
  let score = 0;
  if (movesAvailable > 0) {
    // Having more moves relative to distance is advantageous
    score = (movesAvailable / Math.max(1, movesNeeded)) * 50;
  } else {
    // No valid moves - current player loses
    score = -50;
  }

  // Return from AI's perspective
  return isMaximizing ? score : -score;
}

/**
 * Create a canonical memoization key for game state.
 */
function createStateKey(
  position: number,
  availableSteps: number[],
  isMaximizing: boolean,
): string {
  const remainingSteps = [...availableSteps].sort((a, b) => a - b).join(",");
  return `${position}-${remainingSteps}-${isMaximizing ? 1 : 0}`;
}

/**
 * Minimax algorithm with memoization and depth limit.
 * Returns score from AI's perspective (positive = AI winning)
 * @param depth Current depth (starts at 0)
 * @param maxDepth Maximum depth to search
 */
function minimax(
  state: SequenceState,
  isMaximizing: boolean,
  memo: Map<string, MinimaxResult>,
  depth: number = 0,
  maxDepth: number = 20,
): MinimaxResult {
  // Create state key for memoization (O(n) instead of O(n log n) sort)
  const key = createStateKey(
    state.currentPosition,
    state.availableSteps,
    isMaximizing,
  );

  if (memo.has(key)) {
    return memo.get(key)!;
  }

  // Terminal states
  if (state.gameOver) {
    const score = state.winner === "ai" ? 100 : -100;
    return { score, move: null };
  }

  const validMoves = getValidMoves(state);

  if (validMoves.length === 0) {
    // No moves available - current player loses
    const score = isMaximizing ? -100 : 100;
    return { score, move: null };
  }

  // Depth limit reached - use heuristic evaluation
  if (depth >= maxDepth) {
    const score = heuristicEval(state, isMaximizing);
    return { score, move: validMoves[0] };
  }

  let bestMove: number | null = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of validMoves) {
    const nextState = applyMove(state, move);
    const result = minimax(nextState, !isMaximizing, memo, depth + 1, maxDepth);

    if (isMaximizing) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    }
  }

  const result = { score: bestScore, move: bestMove };
  memo.set(key, result);
  return result;
}

/**
 * Get AI's best move
 */
export function getAIMove(
  state: SequenceState,
  difficulty: "easy" | "medium" | "hard",
): number {
  const validMoves = getValidMoves(state);

  if (validMoves.length === 0) {
    throw new Error("No valid moves available");
  }

  if (difficulty === "easy") {
    // Random move
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  if (difficulty === "medium") {
    // 50% optimal, 50% random
    if (Math.random() < 0.5) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  // Medium/Hard: Optimal with depth limit (Minimax)
  const memo = new Map<string, MinimaxResult>();
  const maxDepth = DEPTH_LIMITS[difficulty];
  const result = minimax(state, true, memo, 0, maxDepth);

  return result.move ?? validMoves[0];
}

/**
 * Analyze if current player has a winning strategy
 * Uses hard difficulty depth for accurate analysis
 */
export function analyzePosition(state: SequenceState): {
  canWin: boolean;
  bestMove: number | null;
} {
  const memo = new Map<string, MinimaxResult>();
  const isAITurn = state.turn === "ai";
  const result = minimax(state, isAITurn, memo, 0, DEPTH_LIMITS.hard);

  return {
    canWin: isAITurn ? result.score > 0 : result.score < 0,
    bestMove: result.move,
  };
}

// ========================================
// Teacher Mode: Move Analysis for Hints
// ========================================

export interface MoveAnalysis {
  wasOptimal: boolean;
  playerMove: number;
  optimalMove: number | null;
  aiCounterMove: number | null;
  explanation: string;
}

/**
 * Analyze a player's move and provide educational feedback
 * Returns hint explaining why move was good/bad and what AI will do
 */
export function analyzePlayerMove(
  stateBefore: SequenceState,
  playerMove: number,
): MoveAnalysis {
  // Get optimal move from this position
  const optimalAnalysis = analyzePosition(stateBefore);
  const wasOptimal = optimalAnalysis.bestMove === playerMove;

  // Simulate the player's move
  const stateAfterPlayer = applyMove(stateBefore, playerMove);

  // If game is over after player move, no counter analysis needed
  if (stateAfterPlayer.gameOver) {
    return {
      wasOptimal: true,
      playerMove,
      optimalMove: playerMove,
      aiCounterMove: null,
      explanation: "You reached the target!",
    };
  }

  // Analyze AI's best response
  const aiAnalysis = analyzePosition(stateAfterPlayer);
  const aiCounterMove = aiAnalysis.bestMove;

  // Generate educational explanation
  let explanation: string;

  if (wasOptimal) {
    if (optimalAnalysis.canWin) {
      explanation = `Good move! You're on track to win.`;
    } else {
      explanation = `Solid choice - making the best of a tough position.`;
    }
  } else {
    // Player made a suboptimal move
    if (optimalAnalysis.canWin && aiAnalysis.canWin) {
      // Player had a winning move but now AI can win
      explanation =
        `If you had taken ${optimalAnalysis.bestMove}, you could have won. ` +
        `Now I can take ${aiCounterMove} and gain the advantage!`;
    } else if (aiCounterMove !== null) {
      explanation = `Interesting choice! I'll take ${aiCounterMove} in response.`;
    } else {
      explanation = `That move changes the game dynamics.`;
    }
  }

  return {
    wasOptimal,
    playerMove,
    optimalMove: optimalAnalysis.bestMove,
    aiCounterMove,
    explanation,
  };
}

// ========================================
// Game Fairness Validation
// ========================================

export interface FairnessResult {
  isPlayerWinnable: boolean;
  isAIWinnable: boolean;
  firstMoverAdvantage: "player" | "ai" | "neither" | "both";
  optimalFirstMove: number | null;
}

/**
 * Validate if a game config is fair for the first player
 * Returns analysis of who can force a win with optimal play
 */
export function validateGameFairness(config: GameConfig): FairnessResult {
  const initialState = createGameState(config);

  // Analyze from player's perspective (player goes first)
  const playerAnalysis = analyzePosition(initialState);

  // Create hypothetical state where AI goes first to check AI advantage
  const aiFirstState: SequenceState = {
    ...initialState,
    turn: "ai",
  };
  const aiAnalysis = analyzePosition(aiFirstState);

  // Determine first mover advantage
  let firstMoverAdvantage: FairnessResult["firstMoverAdvantage"];
  if (playerAnalysis.canWin && !aiAnalysis.canWin) {
    firstMoverAdvantage = "player";
  } else if (!playerAnalysis.canWin && aiAnalysis.canWin) {
    firstMoverAdvantage = "ai";
  } else if (playerAnalysis.canWin && aiAnalysis.canWin) {
    firstMoverAdvantage = "both"; // First mover always wins
  } else {
    firstMoverAdvantage = "neither"; // Second player can always force draw/win
  }

  return {
    isPlayerWinnable: playerAnalysis.canWin,
    isAIWinnable: aiAnalysis.canWin,
    firstMoverAdvantage,
    optimalFirstMove: playerAnalysis.bestMove,
  };
}

/**
 * Validate all preset games and return report
 * Used in dev mode to ensure game balance
 */
export function validateAllPresets(
  presets: GameConfig[],
): Map<string, FairnessResult> {
  const results = new Map<string, FairnessResult>();

  for (const preset of presets) {
    results.set(preset.id, validateGameFairness(preset));
  }

  return results;
}

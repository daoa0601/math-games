/**
 * useAIOpponent Hook
 *
 * Manages AI opponent logic: thinking state, move timing, and emotional reactions.
 * Extracted from SequenceRaceGame for better separation of concerns.
 */

import { useState, useEffect, useMemo } from 'react';
import type { SequenceState, GameMode } from '../logic/types';
import { applyMove, getAIMove, analyzePosition } from '../logic/engine';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type AIReaction = 'confident' | 'worried' | 'neutral';

export interface UseAIOpponentOptions {
  /** Current game state */
  gameState: SequenceState;
  /** Current game mode */
  gameMode: GameMode;
  /** AI difficulty level */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Whether time is up */
  showTimeUp: boolean;
  /** Whether AI moves first in this configuration */
  aiMovesFirst?: boolean;
  /** Callback to update game state after AI move */
  onAIMove: (newState: SequenceState) => void;
}

export interface UseAIOpponentReturn {
  /** Whether AI is currently "thinking" */
  isAIThinking: boolean;
  /** AI's emotional reaction based on game position */
  aiReaction: AIReaction;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

/** Delay before AI makes a move (ms) - creates "thinking" effect */
const AI_THINKING_DELAY = 800;

/** Longer delay for AI's first move when AI moves first - gives player time to read banner */
const AI_FIRST_MOVE_DELAY = 2000;

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useAIOpponent(options: UseAIOpponentOptions): UseAIOpponentReturn {
  const { gameState, gameMode, difficulty, showTimeUp, aiMovesFirst, onAIMove } = options;

  const [isAIThinking, setIsAIThinking] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // AI Reaction (memoized)
  // ─────────────────────────────────────────────────────────────────

  const aiReaction = useMemo((): AIReaction => {
    if (gameState.gameOver || gameMode !== 'vs-ai') return 'neutral';

    const analysis = analyzePosition(gameState);
    if (!analysis) return 'neutral';

    const remaining = gameState.target - gameState.currentPosition;

    // AI is confident when it has winning strategy or player is far behind
    if (!analysis.canWin && remaining > 5) return 'confident';

    // AI is worried when player has winning strategy and is close
    if (analysis.canWin && remaining <= 10) return 'worried';

    return 'neutral';
  }, [gameState, gameMode]);

  // ─────────────────────────────────────────────────────────────────
  // AI Turn Effect
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Only process AI turns in vs-ai mode
    if (gameMode !== 'vs-ai') return;
    if (gameState.turn !== 'ai') return;
    if (gameState.gameOver) return;
    if (showTimeUp) return;

    // This setState is intentional for async state machine (not a cascading render)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAIThinking(true);

    // Use longer delay for AI's first move when AI moves first
    // This gives the player time to read the "AI moves first" banner
    const isFirstMove = gameState.history.length === 0 && aiMovesFirst;
    const delay = isFirstMove ? AI_FIRST_MOVE_DELAY : AI_THINKING_DELAY;

    const timer = setTimeout(() => {
      try {
        const aiMove = getAIMove(gameState, difficulty);
        const newState = applyMove(gameState, aiMove);
        onAIMove(newState);
      } catch (error) {
        console.error('AI error:', error);
      }
      setIsAIThinking(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [gameState, difficulty, showTimeUp, gameMode, aiMovesFirst, onAIMove]);

  return {
    isAIThinking,
    aiReaction,
  };
}

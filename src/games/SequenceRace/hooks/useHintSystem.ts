/**
 * useHintSystem Hook
 *
 * Manages the teacher mode hint system: visibility toggle, move analysis,
 * and hint display for learning feedback.
 */

import { useState, useCallback } from 'react';
import type { SequenceState, GameMode } from '../logic/types';
import { analyzePlayerMove, type MoveAnalysis } from '../logic/engine';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UseHintSystemOptions {
  /** Current game mode */
  gameMode: GameMode;
}

export interface UseHintSystemReturn {
  /** Whether hints panel is visible */
  showHints: boolean;
  /** Current teacher hint from last player move */
  teacherHint: MoveAnalysis | null;
  /** Toggle hints visibility */
  toggleHints: () => void;
  /** Analyze a move and set teacher hint (call before applying move) */
  analyzeMove: (gameState: SequenceState, step: number) => void;
  /** Clear all hints (call when starting new game) */
  clearHints: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useHintSystem(options: UseHintSystemOptions): UseHintSystemReturn {
  const { gameMode } = options;

  const [showHints, setShowHints] = useState(false);
  const [teacherHint, setTeacherHint] = useState<MoveAnalysis | null>(null);

  const toggleHints = useCallback(() => {
    setShowHints((prev) => !prev);
  }, []);

  const analyzeMove = useCallback(
    (gameState: SequenceState, step: number) => {
      // Only analyze in vs-ai mode with hints enabled
      if (showHints && gameMode === 'vs-ai') {
        const analysis = analyzePlayerMove(gameState, step);
        setTeacherHint(analysis);
      }
    },
    [showHints, gameMode]
  );

  const clearHints = useCallback(() => {
    setShowHints(false);
    setTeacherHint(null);
  }, []);

  return {
    showHints,
    teacherHint,
    toggleHints,
    analyzeMove,
    clearHints,
  };
}

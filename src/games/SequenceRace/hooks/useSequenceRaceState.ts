/**
 * useSequenceRaceState Hook
 *
 * Manages core game state: configuration, difficulty, mode, and game state.
 * Extracted from SequenceRaceGame to reduce component complexity.
 */

import { useState, useCallback, useMemo } from 'react';
import type { SequenceState, GameConfig, GameMode } from '../logic/types';
import { createGameState, getValidMoves, analyzePosition } from '../logic/engine';
import { presetGames, generateRandomConfig, SEQUENCE_INFO } from '../logic/presets';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UseSequenceRaceStateOptions {
  /** Callback when timer needs reset */
  onResetTimer?: () => void;
}

export interface UseSequenceRaceStateReturn {
  // State
  difficulty: 'easy' | 'medium' | 'hard';
  gameMode: GameMode;
  currentConfig: GameConfig;
  gameState: SequenceState;

  // Derived state
  filteredGames: GameConfig[];
  validMoves: number[];
  analysis: ReturnType<typeof analyzePosition> | null;
  sequenceInfo: (typeof SEQUENCE_INFO)[keyof typeof SEQUENCE_INFO];

  // Actions
  setGameState: React.Dispatch<React.SetStateAction<SequenceState>>;
  startGame: (config: GameConfig) => void;
  startRandomGame: () => void;
  restartGame: () => void;
  handleDifficultyChange: (newDifficulty: 'easy' | 'medium' | 'hard') => void;
  handleModeChange: (newMode: GameMode) => void;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useSequenceRaceState(
  options: UseSequenceRaceStateOptions = {}
): UseSequenceRaceStateReturn {
  const { onResetTimer } = options;

  // ─────────────────────────────────────────────────────────────────
  // Core state
  // ─────────────────────────────────────────────────────────────────

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameMode, setGameMode] = useState<GameMode>('vs-ai');
  const [currentConfig, setCurrentConfig] = useState<GameConfig>(presetGames[0]);
  const [gameState, setGameState] = useState<SequenceState>(() =>
    createGameState({ ...presetGames[0], mode: 'vs-ai' })
  );

  // ─────────────────────────────────────────────────────────────────
  // Derived state (memoized)
  // ─────────────────────────────────────────────────────────────────

  const filteredGames = useMemo(
    () => presetGames.filter((g) => g.difficulty === difficulty),
    [difficulty]
  );

  const validMoves = useMemo(() => getValidMoves(gameState), [gameState]);

  const analysis = useMemo(() => {
    if (gameState.gameOver) return null;
    return analyzePosition(gameState);
  }, [gameState]);

  const sequenceInfo = useMemo(() => {
    const seqType = currentConfig.sequenceType || 'arithmetic';
    return SEQUENCE_INFO[seqType];
  }, [currentConfig.sequenceType]);

  // ─────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────

  const startGame = useCallback(
    (config: GameConfig) => {
      const configWithMode = { ...config, mode: gameMode };
      setCurrentConfig(configWithMode);
      setGameState(createGameState(configWithMode));
      onResetTimer?.();
    },
    [gameMode, onResetTimer]
  );

  const startRandomGame = useCallback(() => {
    const config = generateRandomConfig(difficulty);
    startGame(config);
  }, [difficulty, startGame]);

  const restartGame = useCallback(() => {
    setGameState(createGameState(currentConfig));
    onResetTimer?.();
  }, [currentConfig, onResetTimer]);

  const handleDifficultyChange = useCallback(
    (newDifficulty: 'easy' | 'medium' | 'hard') => {
      setDifficulty(newDifficulty);
      const newGames = presetGames.filter((g) => g.difficulty === newDifficulty);
      if (newGames.length > 0) {
        const configWithMode = { ...newGames[0], mode: gameMode };
        setCurrentConfig(configWithMode);
        setGameState(createGameState(configWithMode));
        onResetTimer?.();
      }
    },
    [gameMode, onResetTimer]
  );

  const handleModeChange = useCallback(
    (newMode: GameMode) => {
      setGameMode(newMode);
      const configWithMode = { ...currentConfig, mode: newMode };
      setCurrentConfig(configWithMode);
      setGameState(createGameState(configWithMode));
      onResetTimer?.();
    },
    [currentConfig, onResetTimer]
  );

  return {
    // State
    difficulty,
    gameMode,
    currentConfig,
    gameState,

    // Derived
    filteredGames,
    validMoves,
    analysis,
    sequenceInfo,

    // Actions
    setGameState,
    startGame,
    startRandomGame,
    restartGame,
    handleDifficultyChange,
    handleModeChange,
  };
}

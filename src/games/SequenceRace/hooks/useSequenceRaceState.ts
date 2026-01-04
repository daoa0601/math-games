/**
 * useSequenceRaceState Hook
 *
 * Manages core game state: configuration, difficulty, mode, and game state.
 * Extracted from SequenceRaceGame to reduce component complexity.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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

  // Undo state
  canUndo: boolean;

  // Actions
  setGameState: React.Dispatch<React.SetStateAction<SequenceState>>;
  startGame: (config: GameConfig) => void;
  startRandomGame: () => void;
  restartGame: () => void;
  handleDifficultyChange: (newDifficulty: 'easy' | 'medium' | 'hard') => void;
  handleModeChange: (newMode: GameMode) => void;
  undoLastMove: () => void;
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
  // Undo state - tracks previous game states for undo functionality
  // ─────────────────────────────────────────────────────────────────

  const previousStateRef = useRef<SequenceState | null>(null);
  const lastHistoryLengthRef = useRef<number>(0);

  // Track state changes to enable undo
  // We save state BEFORE each move, so undo restores the pre-move state
  useEffect(() => {
    const currentHistoryLength = gameState.history.length;

    // Only save state when a new move is made (history grows)
    if (currentHistoryLength > lastHistoryLengthRef.current && currentHistoryLength > 0) {
      // The previous state is the one before this move was made
      // We construct it by removing the last move from history
      const lastMove = gameState.history[gameState.history.length - 1];
      const previousState: SequenceState = {
        ...gameState,
        currentPosition: gameState.currentPosition - lastMove.step,
        history: gameState.history.slice(0, -1),
        turn: lastMove.player as SequenceState['turn'],
        gameOver: false,
        winner: null,
      };
      previousStateRef.current = previousState;
    }

    // Track history length to detect new moves
    lastHistoryLengthRef.current = currentHistoryLength;
  }, [gameState]);

  // Reset undo state when game restarts
  useEffect(() => {
    if (gameState.history.length === 0) {
      previousStateRef.current = null;
      lastHistoryLengthRef.current = 0;
    }
  }, [gameState.history.length]);

  // Track whether undo is available (updated via effect to avoid ref access during render)
  const [canUndo, setCanUndo] = useState(false);

  // Update canUndo when relevant state changes
  // Can only undo if:
  // 1. There's a previous state to restore
  // 2. Game is not over
  // 3. It's the player's turn (can't undo during AI's turn)
  // Note: This setState in effect is intentional - we sync derived state from ref changes
  useEffect(() => {
    const isPlayerTurn = gameState.turn === 'player' || gameState.turn === 'player1' || gameState.turn === 'player2';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanUndo(previousStateRef.current !== null && !gameState.gameOver && isPlayerTurn);
  }, [gameState.gameOver, gameState.turn, gameState.history.length]);

  const undoLastMove = useCallback(() => {
    if (!previousStateRef.current) return;

    const stateToRestore = previousStateRef.current;
    previousStateRef.current = null; // Clear after use (single undo only)
    setCanUndo(false); // Immediately update canUndo
    setGameState(stateToRestore);
  }, []);

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

    // Undo
    canUndo,

    // Actions
    setGameState,
    startGame,
    startRandomGame,
    restartGame,
    handleDifficultyChange,
    handleModeChange,
    undoLastMove,
  };
}

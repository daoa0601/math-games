/**
 * useGameMachine Hook
 *
 * Wraps the XState game machine with convenient helpers for game components.
 * Provides semantic boolean flags and action dispatchers.
 *
 * @example
 * function MyGame() {
 *   const {
 *     isPlaying,
 *     isPaused,
 *     isComplete,
 *     start,
 *     pause,
 *     resume,
 *     win,
 *     context,
 *   } = useGameMachine();
 *
 *   if (!isPlaying) {
 *     return <button onClick={start}>Start Game</button>;
 *   }
 *
 *   return (
 *     <>
 *       <p>Attempts: {context.attempts}</p>
 *       <button onClick={() => win({ score: 100 })}>Win!</button>
 *     </>
 *   );
 * }
 */

import { useMemo, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { gameMachine, type GameContext, type GameState } from './gameMachine';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UseGameMachineReturn {
  // Current state
  state: GameState;
  context: GameContext;

  // State flags (for conditional rendering)
  isIdle: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isWon: boolean;
  isLost: boolean;
  isTimeUp: boolean;
  isComplete: boolean; // won || lost || timeUp

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  win: (score?: number) => void;
  lose: (error?: string) => void;
  timeout: () => void;
  restart: () => void;
  nextLevel: () => void;
  incrementAttempts: () => void;
  updateTime: (time: number) => void;
  updateScore: (score: number) => void;

  // Raw send for advanced use cases
  send: ReturnType<typeof useMachine<typeof gameMachine>>[1];
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useGameMachine(): UseGameMachineReturn {
  const [snapshot, send] = useMachine(gameMachine);

  // Extract state value as string
  const state = snapshot.value as GameState;
  const context = snapshot.context;

  // Memoized state flags
  const flags = useMemo(() => ({
    isIdle: state === 'idle',
    isPlaying: state === 'playing',
    isPaused: state === 'paused',
    isWon: state === 'won',
    isLost: state === 'lost',
    isTimeUp: state === 'timeUp',
    isComplete: state === 'won' || state === 'lost' || state === 'timeUp',
  }), [state]);

  // Memoized action dispatchers
  const start = useCallback(() => send({ type: 'START' }), [send]);
  const pause = useCallback(() => send({ type: 'PAUSE' }), [send]);
  const resume = useCallback(() => send({ type: 'RESUME' }), [send]);
  const win = useCallback((score?: number) => send({ type: 'WIN', score }), [send]);
  const lose = useCallback((error?: string) => send({ type: 'LOSE', error }), [send]);
  const timeout = useCallback(() => send({ type: 'TIMEOUT' }), [send]);
  const restart = useCallback(() => send({ type: 'RESTART' }), [send]);
  const nextLevel = useCallback(() => send({ type: 'NEXT_LEVEL' }), [send]);
  const incrementAttempts = useCallback(() => send({ type: 'INCREMENT_ATTEMPTS' }), [send]);
  const updateTime = useCallback((time: number) => send({ type: 'UPDATE_TIME', time }), [send]);
  const updateScore = useCallback((score: number) => send({ type: 'UPDATE_SCORE', score }), [send]);

  return {
    state,
    context,
    ...flags,
    start,
    pause,
    resume,
    win,
    lose,
    timeout,
    restart,
    nextLevel,
    incrementAttempts,
    updateTime,
    updateScore,
    send,
  };
}

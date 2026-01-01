/**
 * Game State Machine
 *
 * Generic state machine for managing game flow across all games.
 * Handles states like idle, playing, paused, won, lost, and timeUp.
 *
 * Using XState v5 ensures:
 * - Impossible states are prevented (can't pause while already won)
 * - State transitions are explicit and predictable
 * - Easy to visualize and debug
 *
 * @see docs/adr/0004-xstate-game-flow.md
 */

import { setup, assign } from 'xstate';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface GameContext {
  /** Number of attempts or moves made */
  attempts: number;
  /** Time elapsed in seconds (updated externally) */
  timeElapsed: number;
  /** Optional score value */
  score: number;
  /** Optional error message for failed states */
  error?: string;
}

export type GameState =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'won'
  | 'lost'
  | 'timeUp';

// Event types
export type GameEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'WIN'; score?: number }
  | { type: 'LOSE'; error?: string }
  | { type: 'TIMEOUT' }
  | { type: 'RESTART' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'INCREMENT_ATTEMPTS' }
  | { type: 'UPDATE_TIME'; time: number }
  | { type: 'UPDATE_SCORE'; score: number };

// ═══════════════════════════════════════════════════════════════════
// MACHINE
// ═══════════════════════════════════════════════════════════════════

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  actions: {
    resetContext: assign({
      attempts: 0,
      timeElapsed: 0,
      score: 0,
      error: undefined,
    }),
    incrementAttempts: assign({
      attempts: ({ context }) => context.attempts + 1,
    }),
    updateTime: assign({
      timeElapsed: (_, params: { time: number }) => params.time,
    }),
    updateScore: assign({
      score: (_, params: { score: number }) => params.score,
    }),
    setWinScore: assign({
      score: ({ context, event }) => {
        if (event.type === 'WIN' && event.score !== undefined) {
          return event.score;
        }
        return context.score;
      },
    }),
    setError: assign({
      error: ({ event }) => {
        if (event.type === 'LOSE' && event.error) {
          return event.error;
        }
        return undefined;
      },
    }),
  },
  guards: {
    hasWinScore: ({ event }) => {
      return event.type === 'WIN' && event.score !== undefined;
    },
  },
}).createMachine({
  id: 'game',
  initial: 'idle',
  context: {
    attempts: 0,
    timeElapsed: 0,
    score: 0,
    error: undefined,
  },

  states: {
    // ─────────────────────────────────────────────────────────────────
    // Idle: Initial state, waiting to start
    // ─────────────────────────────────────────────────────────────────
    idle: {
      entry: 'resetContext',
      on: {
        START: { target: 'playing' },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // Playing: Game is active
    // ─────────────────────────────────────────────────────────────────
    playing: {
      on: {
        PAUSE: { target: 'paused' },
        WIN: {
          target: 'won',
          actions: 'setWinScore',
        },
        LOSE: {
          target: 'lost',
          actions: 'setError',
        },
        TIMEOUT: { target: 'timeUp' },
        INCREMENT_ATTEMPTS: {
          actions: 'incrementAttempts',
        },
        UPDATE_TIME: {
          actions: {
            type: 'updateTime',
            params: ({ event }) => ({ time: event.time }),
          },
        },
        UPDATE_SCORE: {
          actions: {
            type: 'updateScore',
            params: ({ event }) => ({ score: event.score }),
          },
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // Paused: Game temporarily stopped
    // ─────────────────────────────────────────────────────────────────
    paused: {
      on: {
        RESUME: { target: 'playing' },
        RESTART: { target: 'idle' },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // Won: Player achieved victory condition
    // ─────────────────────────────────────────────────────────────────
    won: {
      on: {
        RESTART: { target: 'idle' },
        NEXT_LEVEL: { target: 'idle' },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // Lost: Player failed to meet goal
    // ─────────────────────────────────────────────────────────────────
    lost: {
      on: {
        RESTART: { target: 'idle' },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // TimeUp: Timer expired (distinct from lost for different UX)
    // ─────────────────────────────────────────────────────────────────
    timeUp: {
      on: {
        RESTART: { target: 'idle' },
      },
    },
  },
});

// ═══════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════

export type GameMachine = typeof gameMachine;

/**
 * Tutorial State Machine
 *
 * Manages tutorial flow for guiding users through game instructions.
 * Handles navigation between tutorial steps with skip and restart support.
 *
 * Using XState v5 ensures:
 * - Tutorial state is always consistent
 * - Step navigation is explicit and predictable
 * - Easy to track completion and skip states
 *
 * @see docs/adr/0004-xstate-game-flow.md
 */

import { setup, assign } from 'xstate';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface TutorialContext {
  /** Current step number (1-based when active, 0 when idle) */
  currentStep: number;
  /** Total number of tutorial steps */
  totalSteps: number;
  /** Set of completed step numbers */
  completedSteps: Set<number>;
  /** Whether the tutorial was skipped */
  skipped: boolean;
}

export type TutorialEvent =
  | { type: 'START' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SKIP' }
  | { type: 'RESTART' }
  | { type: 'COMPLETE_STEP'; step: number };

export type TutorialState = 'idle' | 'active' | 'completed';

// ═══════════════════════════════════════════════════════════════════
// MACHINE
// ═══════════════════════════════════════════════════════════════════

export const tutorialMachine = setup({
  types: {
    context: {} as TutorialContext,
    events: {} as TutorialEvent,
    input: {} as { totalSteps: number },
  },
  guards: {
    hasMoreSteps: ({ context }) => context.currentStep < context.totalSteps,
    isNotFirstStep: ({ context }) => context.currentStep > 1,
  },
  actions: {
    incrementStep: assign({
      currentStep: ({ context }) => context.currentStep + 1,
    }),
    decrementStep: assign({
      currentStep: ({ context }) => context.currentStep - 1,
    }),
    markSkipped: assign({ skipped: true }),
    resetTutorial: assign({
      currentStep: 1,
      completedSteps: () => new Set<number>(),
      skipped: false,
    }),
    markStepComplete: assign({
      completedSteps: ({ context, event }) => {
        if (event.type === 'COMPLETE_STEP') {
          const newSet = new Set(context.completedSteps);
          newSet.add(event.step);
          return newSet;
        }
        return context.completedSteps;
      },
    }),
    startTutorial: assign({ currentStep: 1 }),
  },
}).createMachine({
  id: 'tutorial',
  initial: 'idle',
  context: ({ input }) => ({
    currentStep: 0,
    totalSteps: input.totalSteps,
    completedSteps: new Set<number>(),
    skipped: false,
  }),

  states: {
    // ─────────────────────────────────────────────────────────────────
    // Idle: Tutorial not yet started
    // ─────────────────────────────────────────────────────────────────
    idle: {
      on: {
        START: {
          target: 'active',
          actions: 'startTutorial',
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // Active: Tutorial in progress, navigating steps
    // ─────────────────────────────────────────────────────────────────
    active: {
      on: {
        NEXT: [
          {
            guard: 'hasMoreSteps',
            actions: 'incrementStep',
          },
          {
            target: 'completed',
          },
        ],
        PREVIOUS: {
          guard: 'isNotFirstStep',
          actions: 'decrementStep',
        },
        SKIP: {
          target: 'completed',
          actions: 'markSkipped',
        },
        COMPLETE_STEP: {
          actions: 'markStepComplete',
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // Completed: Tutorial finished (naturally or skipped)
    // ─────────────────────────────────────────────────────────────────
    completed: {
      on: {
        RESTART: {
          target: 'active',
          actions: 'resetTutorial',
        },
      },
    },
  },
});

// ═══════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════

export type TutorialMachine = typeof tutorialMachine;

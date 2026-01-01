/**
 * Tutorial Hook
 *
 * React hook for managing tutorial state using the tutorial state machine.
 * Provides a clean API for starting, navigating, and completing tutorials.
 *
 * @example
 * ```tsx
 * function GameTutorial() {
 *   const tutorial = useTutorial({
 *     totalSteps: 5,
 *     onComplete: () => console.log('Tutorial done!'),
 *     onSkip: () => console.log('Tutorial skipped'),
 *   });
 *
 *   if (!tutorial.isActive) {
 *     return <button onClick={tutorial.start}>Start Tutorial</button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Step {tutorial.currentStep} of {tutorial.totalSteps}</p>
 *       <button onClick={tutorial.previous} disabled={tutorial.currentStep === 1}>
 *         Previous
 *       </button>
 *       <button onClick={tutorial.next}>Next</button>
 *       <button onClick={tutorial.skip}>Skip</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { tutorialMachine } from '../machines/tutorialMachine';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UseTutorialOptions {
  /** Total number of steps in the tutorial */
  totalSteps: number;
  /** Callback when tutorial is completed naturally */
  onComplete?: () => void;
  /** Callback when tutorial is skipped */
  onSkip?: () => void;
}

export interface UseTutorialReturn {
  /** Current step number (1-based when active, 0 when idle) */
  currentStep: number;
  /** Total number of tutorial steps */
  totalSteps: number;
  /** Set of completed step numbers */
  completedSteps: Set<number>;
  /** Whether the tutorial is currently active */
  isActive: boolean;
  /** Whether the tutorial has been completed */
  isCompleted: boolean;
  /** Whether the tutorial is in idle state (not started) */
  isIdle: boolean;
  /** Start the tutorial from step 1 */
  start: () => void;
  /** Move to the next step (or complete if on last step) */
  next: () => void;
  /** Move to the previous step */
  previous: () => void;
  /** Skip the tutorial and mark as completed */
  skip: () => void;
  /** Restart the tutorial from the beginning */
  restart: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useTutorial({
  totalSteps,
  onComplete,
  onSkip,
}: UseTutorialOptions): UseTutorialReturn {
  const [snapshot, send] = useMachine(tutorialMachine, {
    input: { totalSteps },
  });

  // Track previous completed state to detect transitions
  const wasCompleted = useRef(false);
  const wasSkipped = useRef(false);

  // Memoized actions
  const start = useCallback(() => send({ type: 'START' }), [send]);

  const next = useCallback(() => send({ type: 'NEXT' }), [send]);

  const previous = useCallback(() => send({ type: 'PREVIOUS' }), [send]);

  const skip = useCallback(() => {
    wasSkipped.current = true;
    send({ type: 'SKIP' });
  }, [send]);

  const restart = useCallback(() => {
    wasSkipped.current = false;
    send({ type: 'RESTART' });
  }, [send]);

  // Derived state
  const isActive = snapshot.matches('active');
  const isCompleted = snapshot.matches('completed');
  const isIdle = snapshot.matches('idle');

  // Call callbacks on state transitions
  useEffect(() => {
    if (isCompleted && !wasCompleted.current) {
      if (wasSkipped.current && onSkip) {
        onSkip();
      } else if (!wasSkipped.current && onComplete) {
        onComplete();
      }
    }
    wasCompleted.current = isCompleted;
  }, [isCompleted, onComplete, onSkip]);

  // Reset skipped flag when going back to idle
  useEffect(() => {
    if (isIdle) {
      wasSkipped.current = false;
    }
  }, [isIdle]);

  // Memoize the return value for stable reference
  return useMemo(
    () => ({
      currentStep: snapshot.context.currentStep,
      totalSteps: snapshot.context.totalSteps,
      completedSteps: snapshot.context.completedSteps,
      isActive,
      isCompleted,
      isIdle,
      start,
      next,
      previous,
      skip,
      restart,
    }),
    [
      snapshot.context.currentStep,
      snapshot.context.totalSteps,
      snapshot.context.completedSteps,
      isActive,
      isCompleted,
      isIdle,
      start,
      next,
      previous,
      skip,
      restart,
    ]
  );
}

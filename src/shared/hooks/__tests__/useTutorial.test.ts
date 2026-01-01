/**
 * Tests for useTutorial hook
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTutorial } from '../useTutorial';

describe('useTutorial', () => {
  // ═══════════════════════════════════════════════════════════════════
  // Initial State
  // ═══════════════════════════════════════════════════════════════════

  describe('initial state', () => {
    it('returns idle state initially', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 3 }));

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.totalSteps).toBe(3);
    });

    it('initializes with empty completedSteps', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 5 }));

      expect(result.current.completedSteps.size).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Starting Tutorial
  // ═══════════════════════════════════════════════════════════════════

  describe('start()', () => {
    it('starts tutorial and moves to step 1', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 3 }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.isIdle).toBe(false);
      expect(result.current.currentStep).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════

  describe('next()', () => {
    it('advances to next step', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 3 }));

      act(() => result.current.start());
      act(() => result.current.next());

      expect(result.current.currentStep).toBe(2);
      expect(result.current.isActive).toBe(true);
    });

    it('completes tutorial when on last step', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 2 }));

      act(() => result.current.start());
      expect(result.current.currentStep).toBe(1);

      act(() => result.current.next());
      expect(result.current.currentStep).toBe(2);

      act(() => result.current.next());
      expect(result.current.isCompleted).toBe(true);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('previous()', () => {
    it('moves to previous step', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 3 }));

      act(() => result.current.start());
      act(() => result.current.next());
      act(() => result.current.next());

      expect(result.current.currentStep).toBe(3);

      act(() => result.current.previous());

      expect(result.current.currentStep).toBe(2);
    });

    it('does not go below step 1', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 3 }));

      act(() => result.current.start());
      expect(result.current.currentStep).toBe(1);

      act(() => result.current.previous());

      expect(result.current.currentStep).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Skip and Restart
  // ═══════════════════════════════════════════════════════════════════

  describe('skip()', () => {
    it('completes tutorial immediately', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 5 }));

      act(() => result.current.start());
      act(() => result.current.skip());

      expect(result.current.isCompleted).toBe(true);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('restart()', () => {
    it('resets to active state with step 1', () => {
      const { result } = renderHook(() => useTutorial({ totalSteps: 3 }));

      // Complete the tutorial first
      act(() => result.current.start());
      act(() => result.current.skip());
      expect(result.current.isCompleted).toBe(true);

      // Restart
      act(() => result.current.restart());

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStep).toBe(1);
      expect(result.current.completedSteps.size).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Callbacks
  // ═══════════════════════════════════════════════════════════════════

  describe('callbacks', () => {
    it('calls onComplete when tutorial finishes naturally', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTutorial({ totalSteps: 2, onComplete })
      );

      act(() => result.current.start());
      act(() => result.current.next());
      act(() => result.current.next());

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('calls onSkip when tutorial is skipped', () => {
      const onSkip = vi.fn();
      const { result } = renderHook(() =>
        useTutorial({ totalSteps: 5, onSkip })
      );

      act(() => result.current.start());
      act(() => result.current.skip());

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('calls onSkip but not onComplete when skipping', () => {
      const onComplete = vi.fn();
      const onSkip = vi.fn();
      const { result } = renderHook(() =>
        useTutorial({ totalSteps: 5, onComplete, onSkip })
      );

      act(() => result.current.start());
      act(() => result.current.skip());

      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('does not call callbacks multiple times on re-render', () => {
      const onComplete = vi.fn();
      const { result, rerender } = renderHook(() =>
        useTutorial({ totalSteps: 1, onComplete })
      );

      act(() => result.current.start());
      act(() => result.current.next());

      expect(onComplete).toHaveBeenCalledTimes(1);

      // Trigger re-renders
      rerender();
      rerender();
      rerender();

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Edge Cases
  // ═══════════════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('handles single step tutorial', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTutorial({ totalSteps: 1, onComplete })
      );

      act(() => result.current.start());
      expect(result.current.currentStep).toBe(1);
      expect(result.current.isActive).toBe(true);

      act(() => result.current.next());
      expect(result.current.isCompleted).toBe(true);
      expect(onComplete).toHaveBeenCalled();
    });

    it('provides stable function references', () => {
      const { result, rerender } = renderHook(() =>
        useTutorial({ totalSteps: 3 })
      );

      const firstStart = result.current.start;
      const firstNext = result.current.next;
      const firstPrevious = result.current.previous;
      const firstSkip = result.current.skip;
      const firstRestart = result.current.restart;

      rerender();

      expect(result.current.start).toBe(firstStart);
      expect(result.current.next).toBe(firstNext);
      expect(result.current.previous).toBe(firstPrevious);
      expect(result.current.skip).toBe(firstSkip);
      expect(result.current.restart).toBe(firstRestart);
    });
  });
});

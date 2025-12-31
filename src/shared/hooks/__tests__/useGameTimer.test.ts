import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameTimer, formatTime, DEFAULT_TIMER_DURATION } from '../useGameTimer';

describe('formatTime', () => {
    it('formats 0 seconds as 0:00', () => {
        expect(formatTime(0)).toBe('0:00');
    });

    it('formats seconds under a minute', () => {
        expect(formatTime(5)).toBe('0:05');
        expect(formatTime(30)).toBe('0:30');
        expect(formatTime(59)).toBe('0:59');
    });

    it('formats full minutes', () => {
        expect(formatTime(60)).toBe('1:00');
        expect(formatTime(120)).toBe('2:00');
    });

    it('formats minutes and seconds', () => {
        expect(formatTime(65)).toBe('1:05');
        expect(formatTime(90)).toBe('1:30');
        expect(formatTime(125)).toBe('2:05');
    });
});

describe('useGameTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // Helper to advance timer by N seconds
    const advanceSeconds = (seconds: number) => {
        for (let i = 0; i < seconds; i++) {
            act(() => {
                vi.advanceTimersByTime(1000);
            });
        }
    };

    it('initializes with default duration', () => {
        const { result } = renderHook(() => useGameTimer());

        expect(result.current.timeLeft).toBe(DEFAULT_TIMER_DURATION);
        expect(result.current.timerActive).toBe(true);
        expect(result.current.showTimeUp).toBe(false);
    });

    it('initializes with custom duration', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 30 }));

        expect(result.current.timeLeft).toBe(30);
    });

    it('counts down every second', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 5 }));

        expect(result.current.timeLeft).toBe(5);

        advanceSeconds(1);
        expect(result.current.timeLeft).toBe(4);

        advanceSeconds(1);
        expect(result.current.timeLeft).toBe(3);
    });

    it('shows time up when timer reaches zero', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 2 }));

        advanceSeconds(2);

        expect(result.current.timeLeft).toBe(0);
        expect(result.current.showTimeUp).toBe(true);
        expect(result.current.timerActive).toBe(false);
    });

    it('calls onTimeUp callback when timer reaches zero', () => {
        const onTimeUp = vi.fn();
        renderHook(() => useGameTimer({ duration: 1, onTimeUp }));

        advanceSeconds(1);

        expect(onTimeUp).toHaveBeenCalledTimes(1);
    });

    it('stops counting when isGameOver is true', () => {
        const { result, rerender } = renderHook(
            ({ isGameOver }) => useGameTimer({ duration: 10, isGameOver }),
            { initialProps: { isGameOver: false } }
        );

        advanceSeconds(3);
        expect(result.current.timeLeft).toBe(7);

        // Game ends
        rerender({ isGameOver: true });

        advanceSeconds(3);
        // Timer should not continue
        expect(result.current.timeLeft).toBe(7);
    });

    it('resets timer correctly', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 10 }));

        advanceSeconds(5);
        expect(result.current.timeLeft).toBe(5);

        act(() => {
            result.current.resetTimer();
        });

        expect(result.current.timeLeft).toBe(10);
        expect(result.current.timerActive).toBe(true);
        expect(result.current.showTimeUp).toBe(false);
    });

    it('pauses and resumes timer', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 10 }));

        advanceSeconds(3);
        expect(result.current.timeLeft).toBe(7);

        // Pause
        act(() => {
            result.current.pauseTimer();
        });

        advanceSeconds(3);
        expect(result.current.timeLeft).toBe(7); // No change

        // Resume
        act(() => {
            result.current.resumeTimer();
        });

        advanceSeconds(2);
        expect(result.current.timeLeft).toBe(5);
    });

    it('returns correct timerClass based on time remaining', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 70 }));

        // > 60 seconds: no class
        expect(result.current.timerClass).toBe('');

        advanceSeconds(10); // 60 left
        expect(result.current.timerClass).toBe('timer--warning');

        advanceSeconds(40); // 20 left
        expect(result.current.timerClass).toBe('timer--critical');

        advanceSeconds(10); // 10 left
        expect(result.current.timerClass).toBe('timer--critical');
    });

    it('returns formatted time string', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 65 }));

        expect(result.current.formattedTime).toBe('1:05');

        advanceSeconds(5);
        expect(result.current.formattedTime).toBe('1:00');

        advanceSeconds(30);
        expect(result.current.formattedTime).toBe('0:30');
    });

    it('returns elapsed time', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 60 }));

        expect(result.current.elapsedTime).toBe(0);

        advanceSeconds(15);
        expect(result.current.elapsedTime).toBe(15);

        advanceSeconds(30);
        expect(result.current.elapsedTime).toBe(45);
    });

    it('does not resume after time is up', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 1 }));

        advanceSeconds(1);
        expect(result.current.showTimeUp).toBe(true);

        act(() => {
            result.current.resumeTimer();
        });

        expect(result.current.timerActive).toBe(false);
    });

    it('resets showTimeUp when resetting timer after time up', () => {
        const { result } = renderHook(() => useGameTimer({ duration: 1 }));

        advanceSeconds(1);
        expect(result.current.showTimeUp).toBe(true);

        act(() => {
            result.current.resetTimer();
        });

        expect(result.current.showTimeUp).toBe(false);
        expect(result.current.timeLeft).toBe(1);
        expect(result.current.timerActive).toBe(true);
    });
});

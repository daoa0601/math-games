import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Default timer duration in seconds (2 minutes)
 */
export const DEFAULT_TIMER_DURATION = 120;

/**
 * Format seconds as mm:ss string
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface UseGameTimerOptions {
    /** Timer duration in seconds (default: 60) */
    duration?: number;
    /** Whether the game is over (stops timer) */
    isGameOver?: boolean;
    /** Callback when timer reaches zero */
    onTimeUp?: () => void;
}

export interface UseGameTimerReturn {
    /** Remaining seconds */
    timeLeft: number;
    /** Whether timer is running */
    timerActive: boolean;
    /** Whether time has run out */
    showTimeUp: boolean;
    /** CSS class for timer styling based on urgency */
    timerClass: 'timer--critical' | 'timer--warning' | '';
    /** Formatted time string (mm:ss) */
    formattedTime: string;
    /** Time elapsed in seconds */
    elapsedTime: number;
    /** Reset timer to full duration and restart */
    resetTimer: () => void;
    /** Pause the timer */
    pauseTimer: () => void;
    /** Resume the timer */
    resumeTimer: () => void;
}

/**
 * Shared hook for game timer functionality.
 * Provides countdown, formatting, urgency classes, and pause/resume controls.
 *
 * @example
 * const {
 *   timeLeft,
 *   timerClass,
 *   formattedTime,
 *   showTimeUp,
 *   resetTimer
 * } = useGameTimer({ isGameOver: showWin });
 */
export function useGameTimer(options: UseGameTimerOptions = {}): UseGameTimerReturn {
    const {
        duration = DEFAULT_TIMER_DURATION,
        isGameOver = false,
        onTimeUp,
    } = options;

    const [timeLeft, setTimeLeft] = useState(duration);
    const [timerActive, setTimerActive] = useState(true);
    const [showTimeUp, setShowTimeUp] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onTimeUpRef = useRef(onTimeUp);

    // Keep callback ref updated
    onTimeUpRef.current = onTimeUp;

    // Timer countdown effect
    useEffect(() => {
        if (timerActive && timeLeft > 0 && !isGameOver) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0 && !isGameOver && !showTimeUp) {
            setShowTimeUp(true);
            setTimerActive(false);
            onTimeUpRef.current?.();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [timeLeft, timerActive, isGameOver, showTimeUp]);

    // Reset timer to full duration
    const resetTimer = useCallback(() => {
        setTimeLeft(duration);
        setTimerActive(true);
        setShowTimeUp(false);
    }, [duration]);

    // Pause timer
    const pauseTimer = useCallback(() => {
        setTimerActive(false);
    }, []);

    // Resume timer
    const resumeTimer = useCallback(() => {
        if (!showTimeUp && timeLeft > 0) {
            setTimerActive(true);
        }
    }, [showTimeUp, timeLeft]);

    // Calculate urgency class (proportional to 120s duration)
    const timerClass = timeLeft <= 20
        ? 'timer--critical' as const
        : timeLeft <= 60
            ? 'timer--warning' as const
            : '' as const;

    return {
        timeLeft,
        timerActive,
        showTimeUp,
        timerClass,
        formattedTime: formatTime(timeLeft),
        elapsedTime: duration - timeLeft,
        resetTimer,
        pauseTimer,
        resumeTimer,
    };
}

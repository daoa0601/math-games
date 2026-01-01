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
    /** Timer duration in seconds (default: 120) */
    duration?: number;
    /** Whether the game is over (stops timer) */
    isGameOver?: boolean;
    /** Callback when timer reaches zero */
    onTimeUp?: () => void;
    /** Callback when timer reaches warning thresholds (30s, 10s) */
    onTimeWarning?: (secondsRemaining: number) => void;
    /** Practice mode: timer counts UP, no time limit */
    practiceMode?: boolean;
}

export interface UseGameTimerReturn {
    /** Remaining seconds (competitive) or elapsed seconds (practice) */
    timeLeft: number;
    /** Whether timer is running */
    timerActive: boolean;
    /** Whether time has run out (always false in practice mode) */
    showTimeUp: boolean;
    /** CSS class for timer styling based on urgency */
    timerClass: 'timer--critical' | 'timer--warning' | 'timer--practice' | '';
    /** Formatted time string (mm:ss) */
    formattedTime: string;
    /** Time elapsed in seconds */
    elapsedTime: number;
    /** Whether in practice mode */
    isPracticeMode: boolean;
    /** Whether timer is paused */
    isPaused: boolean;
    /** Reset timer to full duration and restart */
    resetTimer: () => void;
    /** Pause the timer */
    pauseTimer: () => void;
    /** Resume the timer */
    resumeTimer: () => void;
}

/**
 * Shared hook for game timer functionality.
 * Provides countdown/countup, formatting, urgency classes, and pause/resume controls.
 *
 * In competitive mode (default): counts DOWN from duration, shows time-up state at 0.
 * In practice mode: counts UP from 0, no time limit or time-up state.
 *
 * @example
 * const {
 *   timeLeft,
 *   timerClass,
 *   formattedTime,
 *   showTimeUp,
 *   resetTimer,
 *   isPracticeMode
 * } = useGameTimer({ isGameOver: showWin, practiceMode: true });
 */
// Warning thresholds in seconds (announced to screen readers)
const TIME_WARNING_THRESHOLDS = [30, 10];

export function useGameTimer(options: UseGameTimerOptions = {}): UseGameTimerReturn {
    const {
        duration = DEFAULT_TIMER_DURATION,
        isGameOver = false,
        onTimeUp,
        onTimeWarning,
        practiceMode = false,
    } = options;

    // In practice mode, we count up from 0; in competitive mode, count down from duration
    const [timeValue, setTimeValue] = useState(practiceMode ? 0 : duration);
    const [timerActive, setTimerActive] = useState(true);
    const [showTimeUp, setShowTimeUp] = useState(false);

    // Use refs for accurate timing to prevent drift
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Initialize with 0 - will be set to Date.now() in the useEffect below
    const startTimeRef = useRef<number>(0);
    const pausedAtRef = useRef<number>(0); // Elapsed seconds when paused
    const onTimeUpRef = useRef(onTimeUp);
    const onTimeWarningRef = useRef(onTimeWarning);
    const initializedRef = useRef(false);
    // Track which warning thresholds have been announced to prevent duplicates
    const announcedThresholdsRef = useRef<Set<number>>(new Set());

    // Keep callback refs updated (must be in effect to avoid render-phase mutation)
    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    useEffect(() => {
        onTimeWarningRef.current = onTimeWarning;
    }, [onTimeWarning]);

    // Initialize and reset when practice mode or duration changes
    // These setState calls are intentional - they reset timer state when config changes
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        setTimeValue(practiceMode ? 0 : duration);
        setShowTimeUp(false);
        setTimerActive(true);
        /* eslint-enable react-hooks/set-state-in-effect */
        // Set start time here (in effect) to avoid impure render
        startTimeRef.current = Date.now();
        pausedAtRef.current = 0;
        initializedRef.current = true;
        // Reset announced thresholds on mode/duration change
        announcedThresholdsRef.current.clear();
    }, [practiceMode, duration]);

    // Timer effect - uses Date.now() for accurate timing
    useEffect(() => {
        if (timerActive && !isGameOver) {
            // Calculate elapsed time from real clock, not setTimeout accumulation
            const tick = () => {
                const now = Date.now();
                const elapsedMs = now - startTimeRef.current;
                const elapsedSeconds = Math.floor(elapsedMs / 1000) + pausedAtRef.current;

                if (practiceMode) {
                    // Practice mode: count UP indefinitely
                    setTimeValue(elapsedSeconds);
                } else {
                    // Competitive mode: count DOWN
                    const remaining = Math.max(0, duration - elapsedSeconds);
                    setTimeValue(remaining);

                    // Check for warning thresholds (30s, 10s) and announce if not already
                    for (const threshold of TIME_WARNING_THRESHOLDS) {
                        if (
                            remaining <= threshold &&
                            remaining > 0 &&
                            !announcedThresholdsRef.current.has(threshold)
                        ) {
                            announcedThresholdsRef.current.add(threshold);
                            onTimeWarningRef.current?.(threshold);
                        }
                    }

                    if (remaining === 0 && !showTimeUp) {
                        setShowTimeUp(true);
                        setTimerActive(false);
                        onTimeUpRef.current?.();
                    }
                }
            };

            // Initial tick
            tick();

            // Use setInterval with short interval for smooth updates
            // Check every 100ms for sub-second accuracy on display transitions
            timerRef.current = setInterval(tick, 100);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerActive, isGameOver, showTimeUp, practiceMode, duration]);

    // Reset timer
    const resetTimer = useCallback(() => {
        setTimeValue(practiceMode ? 0 : duration);
        setTimerActive(true);
        setShowTimeUp(false);
        startTimeRef.current = Date.now();
        pausedAtRef.current = 0;
        // Reset announced thresholds so they can be re-announced
        announcedThresholdsRef.current.clear();
    }, [duration, practiceMode]);

    // Pause timer - save elapsed time
    const pauseTimer = useCallback(() => {
        const elapsedMs = Date.now() - startTimeRef.current;
        pausedAtRef.current += Math.floor(elapsedMs / 1000);
        setTimerActive(false);
    }, []);

    // Resume timer - reset start time, keep accumulated pause time
    const resumeTimer = useCallback(() => {
        if (practiceMode || (!showTimeUp && timeValue > 0)) {
            startTimeRef.current = Date.now();
            setTimerActive(true);
        }
    }, [showTimeUp, timeValue, practiceMode]);

    // Calculate urgency class
    const timerClass: UseGameTimerReturn['timerClass'] = practiceMode
        ? 'timer--practice'
        : timeValue <= 20
            ? 'timer--critical'
            : timeValue <= 60
                ? 'timer--warning'
                : '';

    // Calculate elapsed time based on mode
    const elapsedTime = practiceMode ? timeValue : duration - timeValue;

    return {
        timeLeft: timeValue,
        timerActive,
        showTimeUp: practiceMode ? false : showTimeUp,
        timerClass,
        formattedTime: formatTime(timeValue),
        elapsedTime,
        isPracticeMode: practiceMode,
        isPaused: !timerActive && !showTimeUp && !isGameOver,
        resetTimer,
        pauseTimer,
        resumeTimer,
    };
}

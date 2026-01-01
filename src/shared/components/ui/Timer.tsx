import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './Timer.css';

export interface TimerProps {
    /** Current time value (remaining in timed mode, elapsed in practice mode) */
    timeLeft: number;
    /** Formatted time string (mm:ss) */
    formattedTime: string;
    /** CSS class for urgency state */
    timerClass: string;
    /** Whether in practice mode */
    isPracticeMode: boolean;
    /** Whether timer is paused */
    isPaused: boolean;
    /** Called when mode changes */
    onModeChange: (practiceMode: boolean) => void;
    /** Called to pause timer */
    onPause: () => void;
    /** Called to resume timer */
    onResume: () => void;
    /** Disable interactions (e.g., during game over) */
    disabled?: boolean;
}

/**
 * Timer component with dual-mode support (Practice/Timed).
 *
 * Features a friendly, child-appropriate design with:
 * - Mode toggle (Practice = relaxed count-up, Timed = competitive countdown)
 * - Pause/resume functionality
 * - Gentle urgency states (warning at 60s, critical at 20s)
 * - Accessible and responsive design
 *
 * Memoized to prevent unnecessary re-renders from parent state changes.
 */
export const Timer = memo(function Timer({
    formattedTime,
    timerClass,
    isPracticeMode,
    isPaused,
    onModeChange,
    onPause,
    onResume,
    disabled = false,
}: TimerProps) {
    const { t } = useTranslation('common');

    const handleToggleTimed = useCallback(() => {
        if (!disabled) {
            onModeChange(false);
        }
    }, [disabled, onModeChange]);

    const handleTogglePractice = useCallback(() => {
        if (!disabled) {
            onModeChange(true);
        }
    }, [disabled, onModeChange]);

    const handlePauseResume = useCallback(() => {
        if (disabled) return;
        if (isPaused) {
            onResume();
        } else {
            onPause();
        }
    }, [disabled, isPaused, onPause, onResume]);

    // Determine the timer's visual state
    const timerStateClass = isPracticeMode
        ? 'timer--practice'
        : timerClass || '';

    return (
        <div className={`timer-container ${disabled ? 'timer-container--disabled' : ''}`}>
            {/* Mode Toggle */}
            <div
                className="timer-mode-toggle"
                role="radiogroup"
                aria-label={t('timer.modeLabel', 'Timer mode')}
            >
                <button
                    type="button"
                    role="radio"
                    aria-checked={!isPracticeMode}
                    className={`timer-mode-toggle__btn ${!isPracticeMode ? 'timer-mode-toggle__btn--active' : ''}`}
                    onClick={handleToggleTimed}
                    disabled={disabled}
                >
                    <span className="timer-mode-toggle__icon">⏱️</span>
                    <span className="timer-mode-toggle__label">{t('timer.timed', 'Timed')}</span>
                </button>
                <button
                    type="button"
                    role="radio"
                    aria-checked={isPracticeMode}
                    className={`timer-mode-toggle__btn ${isPracticeMode ? 'timer-mode-toggle__btn--active' : ''}`}
                    onClick={handleTogglePractice}
                    disabled={disabled}
                >
                    <span className="timer-mode-toggle__icon">🧘</span>
                    <span className="timer-mode-toggle__label">{t('timer.practice', 'Practice')}</span>
                </button>
            </div>

            {/* Timer Display */}
            <div className={`timer-display ${timerStateClass} ${isPaused ? 'timer-display--paused' : ''}`}>
                {/* Decorative ring */}
                <div className="timer-display__ring" />

                {/* Main timer face */}
                <div
                    className="timer-display__face"
                    role="timer"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={isPracticeMode
                        ? t('timer.elapsedTime', 'Elapsed time: {{time}}', { time: formattedTime })
                        : t('timer.remainingTime', 'Time remaining: {{time}}', { time: formattedTime })
                    }
                >
                    <span className="timer-display__icon">
                        {isPracticeMode ? '🧘' : '⏱️'}
                    </span>
                    <span className="timer-display__time">
                        {formattedTime}
                    </span>
                    {isPaused && (
                        <span className="timer-display__paused-badge">
                            {t('timer.paused', 'Paused')}
                        </span>
                    )}
                </div>

                {/* Pause/Resume Button */}
                {!disabled && (
                    <button
                        type="button"
                        className={`timer-pause-btn ${isPaused ? 'timer-pause-btn--paused' : ''}`}
                        onClick={handlePauseResume}
                        aria-label={isPaused ? t('timer.resume', 'Resume timer') : t('timer.pause', 'Pause timer')}
                    >
                        {isPaused ? '▶️' : '⏸️'}
                    </button>
                )}
            </div>

            {/* Mode Description */}
            <p className="timer-mode-hint">
                {isPracticeMode
                    ? t('timer.practiceHint', 'No time limit - learn at your pace!')
                    : t('timer.timedHint', 'Beat the clock!')
                }
            </p>
        </div>
    );
});

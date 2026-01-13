import { memo } from 'react';
import { cn } from '@/shared/lib/utils';

export interface GameHeaderProgress {
  /** Display label (e.g., puzzle name or "Level") */
  label: string;
  /** Current progress number */
  current: number;
  /** Total number */
  total: number;
}

export interface GameHeaderTimer {
  /** Formatted time string (e.g., "2:45") */
  formattedTime: string;
  /** Timer mode affects styling */
  mode: 'timed' | 'practice';
  /** Whether timer is paused */
  isPaused?: boolean;
  /** Urgency class for timed mode */
  urgencyClass?: string;
}

export interface GameHeaderTarget {
  /** Label for the target (e.g., "Target", "Goal") */
  label: string;
  /** Target value to display */
  value: string | number;
}

export interface GameHeaderProps {
  /** Progress information (level, puzzle count, etc.) */
  progress: GameHeaderProgress;
  /** Timer display information */
  timer: GameHeaderTimer;
  /** Optional target display (e.g., target sum in MagicGraph) */
  target?: GameHeaderTarget;
  /** Additional CSS classes */
  className?: string;
}

/**
 * GameHeader - Compact info strip at the top of GameShell.
 *
 * Displays three information blocks in a horizontal strip:
 * - Progress: Current level/puzzle with label
 * - Timer: Time display with mode indicator
 * - Target: Optional target value (game-specific)
 *
 * Uses CSS Grid for equal distribution and alignment.
 * Memoized to prevent re-renders from parent state changes.
 */
export const GameHeader = memo(function GameHeader({
  progress,
  timer,
  target,
  className,
}: GameHeaderProps) {
  return (
    <header
      className={cn('game-header-strip', className)}
      role="banner"
      aria-label="Game status"
    >
      {/* Progress Block */}
      <div
        className="game-header-strip__block game-header-strip__progress"
        data-testid="header-progress"
      >
        <span className="game-header-strip__label">{progress.label}</span>
        <span className="game-header-strip__value">
          {progress.current}
          <span className="game-header-strip__separator">/</span>
          {progress.total}
        </span>
      </div>

      {/* Timer Block */}
      <div
        className={cn(
          'game-header-strip__block game-header-strip__timer',
          timer.mode === 'practice' && 'game-header-strip__timer--practice',
          timer.isPaused && 'game-header-strip__timer--paused',
          timer.urgencyClass
        )}
        data-testid="header-timer"
        role="timer"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="game-header-strip__timer-icon">
          {timer.mode === 'practice' ? '🧘' : '⏱️'}
        </span>
        <span className="game-header-strip__timer-value">
          {timer.formattedTime}
        </span>
        {timer.isPaused && (
          <span className="game-header-strip__paused-indicator">⏸</span>
        )}
      </div>

      {/* Target Block (Optional) */}
      {target && (
        <div
          className="game-header-strip__block game-header-strip__target"
          data-testid="header-target"
        >
          <span className="game-header-strip__label">{target.label}</span>
          <span className="game-header-strip__value game-header-strip__value--accent">
            {target.value}
          </span>
        </div>
      )}
    </header>
  );
});

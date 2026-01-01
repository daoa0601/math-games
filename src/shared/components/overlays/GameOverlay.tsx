/**
 * GameOverlay
 *
 * Base container for game overlays (win, lose, time up).
 * Provides consistent styling and animation patterns.
 *
 * Accessibility:
 * - Focus trap keeps keyboard focus within overlay
 * - Escape key dismissal (when onClose provided)
 * - Auto-focuses first interactive element
 * - ARIA role="dialog" with proper labeling
 */

import { useRef, type ReactNode } from 'react';
import { useFocusTrap } from '@/shared/hooks';
import './GameOverlay.css';

export interface GameOverlayProps {
  /** Overlay variant for styling */
  variant: 'win' | 'lose' | 'timeUp';
  /** Main emoji/icon */
  emoji: string;
  /** Title text */
  title: string;
  /** Optional subtitle/message */
  message?: string;
  /** Stats to display (e.g., time, moves) */
  stats?: Array<{ value: string | number; label: string }>;
  /** Optional hint/tip content */
  hint?: ReactNode;
  /** Action buttons */
  children: ReactNode;
  /** Optional CSS class */
  className?: string;
  /** Callback when Escape key is pressed */
  onClose?: () => void;
  /** Auto-focus first button on mount. Default: true */
  autoFocus?: boolean;
}

export function GameOverlay({
  variant,
  emoji,
  title,
  message,
  stats,
  hint,
  children,
  className = '',
  onClose,
  autoFocus = true,
}: GameOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Trap focus within overlay and handle Escape key
  useFocusTrap({
    containerRef,
    enabled: true,
    autoFocus,
    onEscape: onClose,
  });

  return (
    <div
      ref={containerRef}
      className={`game-overlay game-overlay--${variant} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-overlay-title"
    >
      <div className="game-overlay__emoji" aria-hidden="true">
        {emoji}
      </div>

      <h2
        id="game-overlay-title"
        className={`game-overlay__title game-overlay__title--${variant}`}
      >
        {title}
      </h2>

      {message && <p className="game-overlay__message">{message}</p>}

      {hint && <div className="game-overlay__hint">{hint}</div>}

      {stats && stats.length > 0 && (
        <div className="game-overlay__stats" role="list" aria-label="Game statistics">
          {stats.map((stat, index) => (
            <div key={index} className="game-overlay__stat" role="listitem">
              <span className="game-overlay__stat-value">{stat.value}</span>
              <span className="game-overlay__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="game-overlay__actions">{children}</div>
    </div>
  );
}

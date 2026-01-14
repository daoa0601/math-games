/**
 * VictoryModal
 *
 * Unified game-end overlay for victory, defeat, and time-up screens.
 * Uses BottomSheet for consistent modal behavior across the app.
 *
 * @example
 * <VictoryModal
 *   isOpen={gameState.isSolved}
 *   onClose={() => {}}
 *   variant="win"
 *   emoji="🧱"
 *   title={t('win.title')}
 *   message={t('win.message')}
 *   stats={[
 *     { value: `${elapsedTime}s`, label: t('stats.time') },
 *     { value: pieces, label: t('stats.pieces') },
 *   ]}
 *   insight={{ title: t('insight.title'), message: t('insight.message') }}
 *   actions={<button onClick={nextLevel}>Next Level</button>}
 * />
 */

import type { ReactNode } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { PersonalBestIndicator, type PersonalBestIndicatorProps } from '../PersonalBest';
import './VictoryModal.css';

export type VictoryVariant = 'win' | 'lose' | 'timeUp';

export interface VictoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal closes (optional - some victory screens don't dismiss) */
  onClose?: () => void;
  /** Visual variant for styling */
  variant: VictoryVariant;
  /** Main emoji/icon displayed prominently */
  emoji?: string;
  /** Title text */
  title: string;
  /** Optional subtitle or message */
  message?: string;
  /** Stats to display (e.g., time, moves, score) */
  stats?: Array<{ value: string | number; label: string }>;
  /** Educational insight panel */
  insight?: {
    title: string;
    message: string;
  };
  /** Personal best indicator data */
  personalBest?: Pick<PersonalBestIndicatorProps, 'currentTime' | 'previousBest' | 'isNewBest'>;
  /** Action buttons (Next Level, Try Again, etc.) */
  actions: ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Maps variant to accent color CSS variable
 */
const variantAccents: Record<VictoryVariant, string> = {
  win: 'var(--success, #10b981)',
  lose: 'var(--error, #ef4444)',
  timeUp: 'var(--accent-coral, #f97316)',
};

export function VictoryModal({
  isOpen,
  onClose,
  variant,
  emoji,
  title,
  message,
  stats,
  insight,
  personalBest,
  actions,
  className = '',
}: VictoryModalProps) {
  // Victory screens are typically not dismissible (must take an action)
  const isDismissible = !!onClose;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose ?? (() => {})}
      dismissible={isDismissible}
      detent="content"
      className={`victory-modal victory-modal--${variant} ${className}`}
      ariaLabel={`Game ${variant === 'win' ? 'complete' : variant === 'lose' ? 'over' : 'time up'}`}
    >
      <div className="victory-modal__content">
        {/* Accent line based on variant */}
        <div
          className="victory-modal__accent"
          style={{ backgroundColor: variantAccents[variant] }}
          aria-hidden="true"
        />

        {/* Emoji */}
        {emoji && (
          <div className="victory-modal__emoji" aria-hidden="true">
            {emoji}
          </div>
        )}

        {/* Title */}
        <h2 className={`victory-modal__title victory-modal__title--${variant}`}>
          {title}
        </h2>

        {/* Message */}
        {message && (
          <p className="victory-modal__message">{message}</p>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="victory-modal__stats" role="list" aria-label="Game statistics">
            {stats.map((stat, index) => (
              <div key={index} className="victory-modal__stat" role="listitem">
                <span className="victory-modal__stat-value">{stat.value}</span>
                <span className="victory-modal__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Personal Best Indicator */}
        {personalBest && (
          <PersonalBestIndicator
            currentTime={personalBest.currentTime}
            previousBest={personalBest.previousBest}
            isNewBest={personalBest.isNewBest}
          />
        )}

        {/* Educational Insight */}
        {insight && (
          <div className="victory-modal__insight">
            <h4 className="victory-modal__insight-title">
              <span aria-hidden="true">💡</span> {insight.title}
            </h4>
            <p className="victory-modal__insight-message">{insight.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="victory-modal__actions">
          {actions}
        </div>
      </div>
    </BottomSheet>
  );
}

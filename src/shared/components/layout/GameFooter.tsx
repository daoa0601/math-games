import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

export interface GameFooterProps {
  /** Undo action handler */
  onUndo?: () => void;
  /** Redo action handler */
  onRedo?: () => void;
  /** Hint action handler */
  onHint?: () => void;
  /** Reset/restart puzzle handler */
  onReset?: () => void;
  /** Next puzzle/level handler */
  onNext?: () => void;

  /** Whether undo is available */
  canUndo?: boolean;
  /** Whether redo is available */
  canRedo?: boolean;
  /** Whether the primary action (Next) is available */
  canProceed?: boolean;

  /** Number of hints remaining (shown as badge) */
  hintsRemaining?: number;
  /** Custom label for the primary button */
  primaryLabel?: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * GameFooter - Action bar at the bottom of GameShell.
 *
 * Contains two groups of buttons:
 * - Secondary actions (left): Undo, Redo, Hint, Reset
 * - Primary action (right): Next puzzle/level
 *
 * Buttons show/hide based on provided handlers.
 * Memoized to prevent re-renders from parent state changes.
 */
export const GameFooter = memo(function GameFooter({
  onUndo,
  onRedo,
  onHint,
  onReset,
  onNext,
  canUndo = false,
  canRedo = false,
  canProceed = false,
  hintsRemaining,
  primaryLabel,
  className,
}: GameFooterProps) {
  const { t } = useTranslation('common');

  const hasSecondaryActions = onUndo || onRedo || onHint || onReset;

  return (
    <footer className={cn('game-footer', className)} role="toolbar" aria-label="Game actions">
      {/* Secondary Actions (Left Side) */}
      <div className="game-footer__secondary">
        {onUndo && (
          <button
            type="button"
            className="game-footer__btn game-footer__btn--icon"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label={t('buttons.undo', 'Undo')}
            data-testid="footer-undo"
          >
            <span className="game-footer__btn-icon">↩</span>
          </button>
        )}

        {onRedo && (
          <button
            type="button"
            className="game-footer__btn game-footer__btn--icon"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label={t('buttons.redo', 'Redo')}
            data-testid="footer-redo"
          >
            <span className="game-footer__btn-icon">↪</span>
          </button>
        )}

        {onHint && (
          <button
            type="button"
            className="game-footer__btn"
            onClick={onHint}
            aria-label={
              hintsRemaining !== undefined
                ? t('buttons.hintWithCount', 'Hint ({{count}} remaining)', { count: hintsRemaining })
                : t('buttons.hint', 'Hint')
            }
            data-testid="footer-hint"
          >
            <span className="game-footer__btn-icon">💡</span>
            <span className="game-footer__btn-label">{t('buttons.hint', 'Hint')}</span>
            {hintsRemaining !== undefined && hintsRemaining > 0 && (
              <span className="game-footer__badge">{hintsRemaining}</span>
            )}
          </button>
        )}

        {onReset && (
          <button
            type="button"
            className="game-footer__btn"
            onClick={onReset}
            aria-label={t('buttons.reset', 'Reset')}
            data-testid="footer-reset"
          >
            <span className="game-footer__btn-icon">🔄</span>
            <span className="game-footer__btn-label">{t('buttons.reset', 'Reset')}</span>
          </button>
        )}
      </div>

      {/* Spacer when no secondary actions */}
      {!hasSecondaryActions && <div className="game-footer__spacer" />}

      {/* Primary Action (Right Side) */}
      {onNext && (
        <button
          type="button"
          className="game-footer__btn game-footer__btn--primary"
          onClick={onNext}
          disabled={!canProceed}
          aria-label={primaryLabel ?? t('buttons.nextPuzzle', 'Next puzzle')}
          data-testid="footer-next"
        >
          <span className="game-footer__btn-label">
            {primaryLabel ?? t('buttons.nextPuzzle', 'Next')}
          </span>
          <span className="game-footer__btn-icon">→</span>
        </button>
      )}
    </footer>
  );
});

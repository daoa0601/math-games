/**
 * PersonalBestIndicator Component
 *
 * Shows personal best comparison on game completion.
 * Displays a celebratory badge when a new PB is achieved,
 * or shows the difference from the best time.
 */

import { useTranslation } from 'react-i18next';
import './PersonalBestIndicator.css';

// ============================================================================
// Types
// ============================================================================

export interface PersonalBestIndicatorProps {
  /** Current completion time in seconds */
  currentTime: number;
  /** Previous best time (null if first completion) */
  previousBest: number | null;
  /** Whether this is a new personal best */
  isNewBest: boolean;
  /** Optional CSS class */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PersonalBestIndicator({
  currentTime,
  previousBest,
  isNewBest,
  className = '',
}: PersonalBestIndicatorProps) {
  const { t } = useTranslation();

  // New personal best
  if (isNewBest) {
    const improvement = previousBest !== null ? previousBest - currentTime : null;

    return (
      <div className={`personal-best personal-best--new ${className}`}>
        <span className="personal-best__icon" aria-hidden="true">🎉</span>
        <div className="personal-best__content">
          <span className="personal-best__label">
            {t('personalBest.new', 'New Personal Best!')}
          </span>
          <span className="personal-best__time">{currentTime}s</span>
          {improvement !== null && improvement > 0 && (
            <span className="personal-best__improvement">
              {t('personalBest.improvement', '{{seconds}}s faster!', { seconds: improvement })}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Previous best exists - show comparison
  if (previousBest !== null) {
    const diff = currentTime - previousBest;
    const isTied = diff === 0;

    return (
      <div className={`personal-best ${isTied ? 'personal-best--tied' : ''} ${className}`}>
        <span className="personal-best__icon" aria-hidden="true">
          {isTied ? '🎯' : '⏱️'}
        </span>
        <div className="personal-best__content">
          <span className="personal-best__label">
            {isTied
              ? t('personalBest.tied', 'Matched your best!')
              : t('personalBest.best', 'Your best')}
          </span>
          <span className="personal-best__time">{previousBest}s</span>
          {!isTied && (
            <span className="personal-best__diff">
              (+{diff}s)
            </span>
          )}
        </div>
      </div>
    );
  }

  // First completion - no previous best to compare
  return (
    <div className={`personal-best personal-best--first ${className}`}>
      <span className="personal-best__icon" aria-hidden="true">⭐</span>
      <div className="personal-best__content">
        <span className="personal-best__label">
          {t('personalBest.first', 'First Completion!')}
        </span>
        <span className="personal-best__time">{currentTime}s</span>
      </div>
    </div>
  );
}

export default PersonalBestIndicator;

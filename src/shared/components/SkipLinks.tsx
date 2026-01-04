import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SkipLinksProps {
  mainId?: string;
  gameAreaId?: string;
}

export function SkipLinks({
  mainId = 'main-content',
  gameAreaId = 'game-area'
}: SkipLinksProps) {
  const { t } = useTranslation();

  // Handle skip link click to ensure focus moves to target element
  // This is needed because some browsers (Safari) don't automatically focus
  // anchor targets even when they have tabIndex={-1}
  const handleSkipClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        // Scroll to target
        target.scrollIntoView({ behavior: 'auto' });
        // Focus the target element
        target.focus({ preventScroll: true });
        // Update URL hash
        window.history.pushState(null, '', `#${targetId}`);
      }
    },
    []
  );

  return (
    <nav className="skip-links" aria-label={t('a11y.skipLinks')}>
      <a
        href={`#${mainId}`}
        className="skip-link"
        onClick={(e) => handleSkipClick(e, mainId)}
      >
        {t('a11y.skipToMain')}
      </a>
      {gameAreaId && (
        <a
          href={`#${gameAreaId}`}
          className="skip-link"
          onClick={(e) => handleSkipClick(e, gameAreaId)}
        >
          {t('a11y.skipToGame')}
        </a>
      )}
    </nav>
  );
}

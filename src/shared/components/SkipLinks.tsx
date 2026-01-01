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

  return (
    <nav className="skip-links" aria-label={t('a11y.skipLinks')}>
      <a href={`#${mainId}`} className="skip-link">
        {t('a11y.skipToMain')}
      </a>
      {gameAreaId && (
        <a href={`#${gameAreaId}`} className="skip-link">
          {t('a11y.skipToGame')}
        </a>
      )}
    </nav>
  );
}

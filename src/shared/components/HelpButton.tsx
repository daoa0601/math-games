import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { resetTutorialProgress } from '../services/tutorialProgress';

interface HelpButtonProps {
  gameId: string;
  onShowTutorial: () => void;
}

export function HelpButton({ gameId, onShowTutorial }: HelpButtonProps) {
  const { t } = useTranslation();

  const handleClick = () => {
    resetTutorialProgress(gameId);
    onShowTutorial();
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      aria-label={t('tutorial.showHelp')}
      title={t('tutorial.showHelp')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </Button>
  );
}

import { useTranslation } from 'react-i18next';
import './ErrorBoundary.css';

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/**
 * Error Fallback UI - displays when a game crashes
 * Separated from ErrorBoundary for Fast Refresh compatibility
 */
export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className="error-boundary">
      <div className="error-boundary__content">
        <div className="error-boundary__icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
        </div>
        <h2 className="error-boundary__title">{t('errors.somethingWentWrong', 'Something went wrong')}</h2>
        <p className="error-boundary__message">
          {t('errors.gameError', "The game encountered an error. Don't worry, your progress has been saved.")}
        </p>
        {error && import.meta.env.DEV && (
          <details className="error-boundary__details">
            <summary>{t('errors.technicalDetails', 'Technical Details')}</summary>
            <pre>{error.message}</pre>
            <pre>{error.stack}</pre>
          </details>
        )}
        <div className="error-boundary__actions">
          <button onClick={onReset} className="error-boundary__btn error-boundary__btn--primary">
            {t('errors.tryAgain', 'Try Again')}
          </button>
          <a href="/" className="error-boundary__btn error-boundary__btn--secondary">
            {t('errors.goHome', 'Go Home')}
          </a>
        </div>
      </div>
    </div>
  );
}

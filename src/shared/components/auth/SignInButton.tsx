/**
 * Sign In Button
 *
 * A compact sign-in button for headers and navigation.
 */

import { useTranslation } from 'react-i18next';
import './SignInButton.css';

interface SignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}

export function SignInButton({ onClick, disabled, variant = 'default' }: SignInButtonProps) {
  const { t } = useTranslation('common');

  return (
    <button
      className={`sign-in-button sign-in-button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={t('auth.signIn', 'Sign In')}
      aria-label={t('auth.signIn', 'Sign In')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
      {variant === 'default' && (
        <span>{t('auth.signIn', 'Sign In')}</span>
      )}
    </button>
  );
}

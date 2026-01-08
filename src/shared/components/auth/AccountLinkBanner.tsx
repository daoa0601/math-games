/**
 * Account Link Banner
 *
 * Prompts anonymous users to link their account for cross-device sync.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './AccountLinkBanner.css';

interface AccountLinkBannerProps {
  onLinkClick: () => void;
  onDismiss?: () => void;
}

export function AccountLinkBanner({ onLinkClick, onDismiss }: AccountLinkBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  if (dismissed) return null;

  return (
    <div className="account-link-banner">
      <div className="account-link-banner__content">
        <svg className="account-link-banner__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span className="account-link-banner__text">
          {t('auth.linkBannerText', 'Link your account to save progress across devices')}
        </span>
      </div>
      <div className="account-link-banner__actions">
        <button className="account-link-banner__link" onClick={onLinkClick}>
          {t('auth.linkNow', 'Link Now')}
        </button>
        <button className="account-link-banner__dismiss" onClick={handleDismiss} aria-label={t('common.dismiss', 'Dismiss')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

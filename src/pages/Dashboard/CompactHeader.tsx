import { useTranslation } from 'react-i18next';
import type { PlayerProfile } from '@/shared/schemas';
import type { RankThreshold } from '@/shared/services/rank';
import { SyncIndicator, type SyncStatus } from '@/shared/components/ui';
import './CompactHeader.css';

interface CompactHeaderProps {
  profile: PlayerProfile;
  rankInfo: RankThreshold;
  streak: number;
  isGuest?: boolean;
  isFirebaseUser?: boolean;
  isAnonymous?: boolean;
  syncStatus?: SyncStatus;
  onLogout?: () => void;
  onSignIn?: () => void;
  onLogin?: () => void;
}

export function CompactHeader({
  profile,
  rankInfo,
  streak,
  isGuest,
  isFirebaseUser,
  isAnonymous,
  syncStatus,
  onLogout,
  onSignIn,
  onLogin,
}: CompactHeaderProps) {
  const { t } = useTranslation();

  // Show sync indicator only for Firebase users
  const showSyncStatus = isFirebaseUser && syncStatus;

  return (
    <header className="compact-header">
      <div className="compact-header__rank">
        <span className="compact-header__rank-icon">{rankInfo.icon}</span>
      </div>
      <div className="compact-header__info">
        <span className="compact-header__name">
          {profile.displayName || (isGuest ? t('login.guestLabel', 'Guest') : profile.id)}
        </span>
        <div className="compact-header__status">
          <span className="compact-header__rank-name">
            {t(rankInfo.displayNameKey)}
          </span>
          {showSyncStatus && (
            <SyncIndicator status={syncStatus} className="compact-header__sync" />
          )}
        </div>
      </div>
      {streak > 0 && (
        <div className="compact-header__streak" title={t('player.streak')}>
          <span className="compact-header__streak-count">{streak}</span>
          <span className="compact-header__streak-label">{t('player.streak')}</span>
        </div>
      )}
      {isGuest && onSignIn && (
        <button
          className="compact-header__login"
          onClick={onSignIn}
          title={t('login.signIn', 'Sign In')}
          aria-label={t('login.signIn', 'Sign In')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </button>
      )}
      {isAnonymous && !isGuest && onLogin && (
        <button
          className="compact-header__login"
          onClick={onLogin}
          title={t('auth.signIn', 'Sign In')}
          aria-label={t('auth.signIn', 'Sign In')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </button>
      )}
      {!isGuest && onLogout && (
        <button
          className="compact-header__logout"
          onClick={onLogout}
          title={t('login.logout', 'Logout')}
          aria-label={t('login.logout', 'Logout')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      )}
    </header>
  );
}

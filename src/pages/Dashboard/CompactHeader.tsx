import { useTranslation } from 'react-i18next';
import type { PlayerProfile } from '@/shared/schemas';
import type { RankThreshold } from '@/shared/services/rank';
import './CompactHeader.css';

interface CompactHeaderProps {
  profile: PlayerProfile;
  rankInfo: RankThreshold;
  streak: number;
  isGuest?: boolean;
  onLogout?: () => void;
}

export function CompactHeader({ profile, rankInfo, streak, isGuest, onLogout }: CompactHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="compact-header">
      <div className="compact-header__rank">
        <span className="compact-header__rank-icon">{rankInfo.icon}</span>
      </div>
      <div className="compact-header__info">
        <span className="compact-header__name">
          {isGuest
            ? t('login.guestLabel', 'Guest')
            : (profile.displayName || profile.id)}
        </span>
        <span className="compact-header__rank-name">
          {isGuest
            ? t('login.guestHint', 'Progress saved locally')
            : t(rankInfo.displayNameKey)}
        </span>
      </div>
      {streak > 0 && !isGuest && (
        <div className="compact-header__streak" title={t('player.streak')}>
          <span className="compact-header__streak-count">{streak}</span>
          <span className="compact-header__streak-label">streak</span>
        </div>
      )}
      {onLogout && (
        <button
          className="compact-header__logout"
          onClick={onLogout}
          title={isGuest ? t('login.signIn', 'Sign In') : t('login.logout', 'Logout')}
          aria-label={isGuest ? t('login.signIn', 'Sign In') : t('login.logout', 'Logout')}
        >
          {isGuest ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
        </button>
      )}
    </header>
  );
}

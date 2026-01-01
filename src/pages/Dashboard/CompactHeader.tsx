import { useTranslation } from 'react-i18next';
import type { PlayerProfile } from '@/shared/schemas';
import type { RankThreshold } from '@/shared/services/rank';
import { LanguageSwitcher, SoundToggle, HighContrastToggle } from '@/shared/components';
import './CompactHeader.css';

interface CompactHeaderProps {
  profile: PlayerProfile;
  rankInfo: RankThreshold;
  streak: number;
}

export function CompactHeader({ profile, rankInfo, streak }: CompactHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="compact-header">
      <div className="compact-header__profile">
        <div
          className="compact-header__rank-badge"
          style={{ background: `linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))` }}
        >
          <span className="compact-header__rank-icon">{rankInfo.icon}</span>
        </div>
        <div className="compact-header__info">
          <span className="compact-header__name">{profile.displayName}</span>
          <span className="compact-header__rank">{t(rankInfo.displayNameKey)}</span>
        </div>
        {streak > 0 && (
          <div className="compact-header__streak" title={t('player.streak')}>
            <span className="compact-header__streak-icon">🔥</span>
            <span className="compact-header__streak-count">{streak}</span>
          </div>
        )}
      </div>
      <div className="compact-header__controls">
        <SoundToggle />
        <HighContrastToggle />
        <LanguageSwitcher />
      </div>
    </header>
  );
}

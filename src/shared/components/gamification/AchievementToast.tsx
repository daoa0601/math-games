/**
 * Achievement Toast Component
 * Slide-in notification for achievement unlocks
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Achievement } from '../../services';
import { getRarityColor } from '../../services';
import { playSound } from '../../utils';
import './AchievementToast.css';

// Module-level sound throttling to prevent audio chaos with multiple toasts
let lastSoundTime = 0;
const SOUND_COOLDOWN = 2000; // Only play sound once per 2 seconds

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
  duration?: number;  // ms, default 4000
  delay?: number;     // ms, for staggering multiple toasts
}

export function AchievementToast({
  achievement,
  onClose,
  duration = 4000,
  delay = 0,
}: AchievementToastProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Delay before showing (for staggering)
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      // Throttle sound to prevent audio chaos with multiple achievements
      const now = Date.now();
      if (now - lastSoundTime > SOUND_COOLDOWN) {
        playSound('win');
        lastSoundTime = now;
      }
    }, delay);

    // Auto-dismiss
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
    }, delay + duration);

    // Cleanup after animation
    const closeTimer = setTimeout(() => {
      onClose();
    }, delay + duration + 300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
  }, [delay, duration, onClose]);

  const handleClick = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const rarityColor = getRarityColor(achievement.rarity);

  return (
    <div
      className={`achievement-toast ${isVisible ? 'achievement-toast--visible' : ''} ${isLeaving ? 'achievement-toast--leaving' : ''}`}
      style={{ '--rarity-color': rarityColor } as React.CSSProperties}
      onClick={handleClick}
      role="alert"
      aria-live="polite"
    >
      <div className="achievement-toast__icon">
        {achievement.icon}
      </div>

      <div className="achievement-toast__content">
        <div className="achievement-toast__header">
          <span className="achievement-toast__label">
            {t('achievements.unlocked')}
          </span>
          <span className={`achievement-toast__rarity achievement-toast__rarity--${achievement.rarity}`}>
            {t(`achievements.rarity${achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}`)}
          </span>
        </div>

        <h4 className="achievement-toast__name">
          {t(achievement.nameKey)}
        </h4>

        <p className="achievement-toast__description">
          {t(achievement.descriptionKey)}
        </p>
      </div>

      <button
        className="achievement-toast__close"
        onClick={handleClick}
        aria-label={t('common.close')}
      >
        ×
      </button>
    </div>
  );
}

export default AchievementToast;

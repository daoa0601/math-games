/**
 * Achievements Gallery Component
 * Expandable section showing all achievements organized by category
 */

import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAchievementsByCategory,
  getAchievementStats,
  getRarityColor,
  type Achievement,
  type AchievementCategory,
} from '../../services';
import './AchievementsGallery.css';

interface AchievementsGalleryProps {
  unlockedAchievementIds: string[];
  isExpanded: boolean;
  onToggle: () => void;
}

const CATEGORY_ORDER: AchievementCategory[] = [
  'global',
  'magic-graph',
  'sequence-race',
  'shape-architect',
];

export function AchievementsGallery({
  unlockedAchievementIds,
  isExpanded,
  onToggle,
}: AchievementsGalleryProps) {
  const { t } = useTranslation('common');

  // Get stats for progress display
  const stats = useMemo(
    () => getAchievementStats(unlockedAchievementIds),
    [unlockedAchievementIds]
  );

  // Organize achievements by category
  const achievementsByCategory = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      achievements: getAchievementsByCategory(category),
    }));
  }, []);

  const isUnlocked = (id: string) => unlockedAchievementIds.includes(id);

  return (
    <div className="achievements-gallery">
      {/* Toggle Header */}
      <button
        className="achievements-gallery__toggle"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls="achievements-gallery-content"
      >
        <div className="achievements-gallery__toggle-left">
          <span className="achievements-gallery__toggle-icon">🏆</span>
          <span className="achievements-gallery__toggle-title">
            {isExpanded ? t('achievements.hideAll') : t('achievements.viewAll')}
          </span>
        </div>
        <div className="achievements-gallery__toggle-right">
          <span className="achievements-gallery__progress">
            {t('achievements.progress', {
              count: stats.unlocked,
              total: stats.total,
            })}
          </span>
          <span
            className={`achievements-gallery__chevron ${isExpanded ? 'achievements-gallery__chevron--expanded' : ''}`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Expandable Content */}
      <div
        id="achievements-gallery-content"
        className={`achievements-gallery__content ${isExpanded ? 'achievements-gallery__content--expanded' : ''}`}
      >
        {achievementsByCategory.map(({ category, achievements }) => (
          <div key={category} className="achievements-gallery__category">
            <h3 className="achievements-gallery__category-title">
              {t(`achievements.categories.${category}`)}
              <span className="achievements-gallery__category-count">
                ({achievements.filter((a) => isUnlocked(a.id)).length}/
                {achievements.length})
              </span>
            </h3>
            <div className="achievements-gallery__grid">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isUnlocked(achievement.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
}

const AchievementCard = memo(function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
  const { t } = useTranslation();
  const rarityColor = getRarityColor(achievement.rarity);

  const style = useMemo(() => ({
    '--rarity-color': rarityColor
  } as React.CSSProperties), [rarityColor]);

  return (
    <div
      className={`achievement-card ${isUnlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}
      style={style}
    >
      <div className="achievement-card__icon">
        {isUnlocked ? achievement.icon : '🔒'}
      </div>
      <div className="achievement-card__content">
        <div className="achievement-card__header">
          <span className="achievement-card__name">
            {isUnlocked ? t(achievement.nameKey) : t('achievements.locked')}
          </span>
          <span
            className={`achievement-card__rarity achievement-card__rarity--${achievement.rarity}`}
          >
            {t(
              `achievements.rarity${achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}`
            )}
          </span>
        </div>
        <p className="achievement-card__description">
          {isUnlocked ? t(achievement.descriptionKey) : '???'}
        </p>
      </div>
    </div>
  );
});

export default AchievementsGallery;

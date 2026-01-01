/**
 * AchievementsTab Component
 *
 * Displays all achievements organized by category with unlock status
 */

import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/shared/contexts/usePlayerHooks';
import { ACHIEVEMENTS, type AchievementCategory } from '@/shared/services/achievements';
import './AchievementsTab.css';

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  global: '🌍',
  'magic-graph': '✨',
  'sequence-race': '🏃',
  'shape-architect': '🏗️',
};

const RARITY_CLASSES: Record<string, string> = {
  common: 'rarity-common',
  rare: 'rarity-rare',
  epic: 'rarity-epic',
  legendary: 'rarity-legendary',
};

export function AchievementsTab() {
  const { t } = useTranslation();
  const { profile } = usePlayer();

  const unlockedAchievements = profile.achievements;
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;

  // Group achievements by category
  const categories: AchievementCategory[] = ['global', 'magic-graph', 'sequence-race', 'shape-architect'];

  return (
    <div
      className="achievements-tab"
      role="tabpanel"
      id="tabpanel-achievements"
      aria-labelledby="tab-achievements"
    >
      {/* Header with progress */}
      <div className="achievements-tab__header">
        <h2 className="achievements-tab__title">
          {t('achievements.progress', { count: unlockedCount, total: totalAchievements })}
        </h2>
      </div>

      {/* Categories */}
      <div className="achievements-tab__categories">
        {categories.map((category) => {
          const categoryAchievements = ACHIEVEMENTS.filter((a) => a.category === category);

          return (
            <section key={category} className="achievements-category">
              <h3 className="achievements-category__header">
                <span className="achievements-category__icon" aria-hidden="true">
                  {CATEGORY_ICONS[category]}
                </span>
                <span className="achievements-category__name">
                  {t(`achievements.categories.${category}`)}
                </span>
              </h3>

              <div className="achievements-category__grid">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedAchievements.includes(achievement.id);

                  return (
                    <div
                      key={achievement.id}
                      className={`achievement-card ${isUnlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}
                    >
                      <div className="achievement-card__icon" aria-hidden="true">
                        {isUnlocked ? achievement.icon : '🔒'}
                      </div>

                      <div className="achievement-card__content">
                        <h4 className="achievement-card__name">
                          {isUnlocked ? t(achievement.nameKey) : '???'}
                        </h4>

                        <p
                          className={`achievement-card__rarity ${RARITY_CLASSES[achievement.rarity]}`}
                        >
                          {t(`achievements.rarity.${achievement.rarity}`)}
                        </p>

                        <p className="achievement-card__description">
                          {isUnlocked ? t(achievement.descriptionKey) : '???'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

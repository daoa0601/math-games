/**
 * ProfileTab - Merged Stats + Achievements view
 * Linear Editorial design - minimal, data-focused
 */

import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/shared/contexts';
import { ACHIEVEMENTS, type AchievementCategory } from '@/shared/services/achievements';
import './ProfileTab.css';

const CATEGORIES: AchievementCategory[] = ['global', 'magic-graph', 'sequence-race', 'shape-architect'];

export function ProfileTab() {
  const { t } = useTranslation();
  const { profile, currentRankInfo, nextRank, rankProgress } = usePlayer();
  const { stats } = profile;

  const unlockedAchievements = profile.achievements;

  return (
    <div className="profile-tab" role="tabpanel" id="panel-profile">
      {/* Rank Section */}
      <section className="profile-section">
        <div className="profile-rank">
          <span className="profile-rank__icon">{currentRankInfo.icon}</span>
          <div className="profile-rank__info">
            <span className="profile-rank__name">{t(`ranks.${currentRankInfo.rank}`)}</span>
            {nextRank && rankProgress && (
              <span className="profile-rank__progress">
                {rankProgress.progressPercent}% → {t(`ranks.${nextRank.rank}`)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="profile-section">
        <h2 className="profile-section__title">{t('stats.overall')}</h2>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat__value">{stats.totalGamesPlayed}</span>
            <span className="profile-stat__label">{t('stats.gamesPlayed')}</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">{stats.totalPuzzlesSolved}</span>
            <span className="profile-stat__label">{t('stats.puzzlesSolved')}</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">{stats.totalWins}</span>
            <span className="profile-stat__label">{t('stats.wins')}</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">{profile.streak}</span>
            <span className="profile-stat__label">{t('stats.streak')}</span>
          </div>
        </div>
      </section>

      {/* Game Breakdown */}
      <section className="profile-section">
        <h2 className="profile-section__title">{t('stats.breakdown')}</h2>
        <div className="profile-breakdown">
          <div className="profile-game-row">
            <span className="profile-game-row__name">{t('magicGraph:title')}</span>
            <span className="profile-game-row__stat">{stats.magicGraphSolved}</span>
          </div>
          <div className="profile-game-row">
            <span className="profile-game-row__name">{t('sequenceRace:title')}</span>
            <span className="profile-game-row__stat">{stats.sequenceRaceWins}</span>
          </div>
          <div className="profile-game-row">
            <span className="profile-game-row__name">{t('shapeArchitect:title')}</span>
            <span className="profile-game-row__stat">{stats.shapeArchitectBuilt}</span>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="profile-section">
        <h2 className="profile-section__title">
          {t('achievements.progress', {
            count: unlockedAchievements.length,
            total: ACHIEVEMENTS.length
          })}
        </h2>

        {CATEGORIES.map((category) => {
          const categoryAchievements = ACHIEVEMENTS.filter((a) => a.category === category);
          const unlockedInCategory = categoryAchievements.filter((a) =>
            unlockedAchievements.includes(a.id)
          );

          if (categoryAchievements.length === 0) return null;

          return (
            <div key={category} className="profile-achievement-category">
              <h3 className="profile-achievement-category__title">
                {t(`achievements.categories.${category}`)}
                <span className="profile-achievement-category__count">
                  {unlockedInCategory.length}/{categoryAchievements.length}
                </span>
              </h3>
              <div className="profile-achievement-grid">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedAchievements.includes(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`profile-achievement ${isUnlocked ? 'profile-achievement--unlocked' : ''}`}
                    >
                      <span className="profile-achievement__icon">
                        {isUnlocked ? achievement.icon : '○'}
                      </span>
                      <span className="profile-achievement__name">
                        {isUnlocked ? t(achievement.nameKey) : '???'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

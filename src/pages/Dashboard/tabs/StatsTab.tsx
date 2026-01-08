import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/shared/contexts';
import { ProgressRing } from '@/shared/components';
import './StatsTab.css';

export function StatsTab() {
  const { t } = useTranslation();
  const { profile, currentRankInfo, nextRank, rankProgress } = usePlayer();
  const { stats } = profile;

  return (
    <div className="stats-tab" role="tabpanel" id="panel-stats" aria-labelledby="tab-stats">
      {/* Overall Stats */}
      <section className="stats-tab__section">
        <h2 className="stats-tab__heading">{t('stats.overall')}</h2>
        <div className="stats-tab__grid">
          <div className="stats-tab__card">
            <span className="stats-tab__card-icon">🎮</span>
            <span className="stats-tab__card-value">{stats.totalGamesPlayed}</span>
            <span className="stats-tab__card-label">{t('stats.gamesPlayed')}</span>
          </div>
          <div className="stats-tab__card">
            <span className="stats-tab__card-icon">✓</span>
            <span className="stats-tab__card-value">{stats.totalPuzzlesSolved}</span>
            <span className="stats-tab__card-label">{t('stats.puzzlesSolved')}</span>
          </div>
          <div className="stats-tab__card">
            <span className="stats-tab__card-icon">🏆</span>
            <span className="stats-tab__card-value">{stats.totalWins}</span>
            <span className="stats-tab__card-label">{t('stats.wins')}</span>
          </div>
          <div className="stats-tab__card">
            <span className="stats-tab__card-icon">🔥</span>
            <span className="stats-tab__card-value">{profile.streak}</span>
            <span className="stats-tab__card-label">{t('stats.streak')}</span>
          </div>
        </div>
      </section>

      {/* Rank Progress */}
      <section className="stats-tab__section">
        <h2 className="stats-tab__heading">{t('stats.rankProgress')}</h2>
        <div className="stats-tab__rank-card">
          <div className="stats-tab__rank-current">
            <span
              className="stats-tab__rank-badge"
              style={{
                background: `linear-gradient(135deg, hsl(${currentRankInfo.rank === 'beginner' ? '120, 60%, 50%' :
                  currentRankInfo.rank === 'learner' ? '200, 70%, 55%' :
                  currentRankInfo.rank === 'apprentice' ? '30, 80%, 60%' :
                  currentRankInfo.rank === 'intermediate' ? '45, 90%, 55%' :
                  currentRankInfo.rank === 'advanced' ? '280, 70%, 60%' :
                  currentRankInfo.rank === 'expert' ? '15, 85%, 55%' :
                  currentRankInfo.rank === 'master' ? '270, 75%, 60%' :
                  '50, 100%, 60%'}), hsl(${currentRankInfo.rank === 'beginner' ? '120, 60%, 40%' :
                  currentRankInfo.rank === 'learner' ? '200, 70%, 45%' :
                  currentRankInfo.rank === 'apprentice' ? '30, 80%, 50%' :
                  currentRankInfo.rank === 'intermediate' ? '45, 90%, 45%' :
                  currentRankInfo.rank === 'advanced' ? '280, 70%, 50%' :
                  currentRankInfo.rank === 'expert' ? '15, 85%, 45%' :
                  currentRankInfo.rank === 'master' ? '270, 75%, 50%' :
                  '50, 100%, 50%'}))`
              }}
            >
              {currentRankInfo.icon}
            </span>
            <div className="stats-tab__rank-info">
              <span className="stats-tab__rank-name">{t(`ranks.${currentRankInfo.rank}`)}</span>
              {nextRank && rankProgress && (
                <span className="stats-tab__rank-next">
                  {t('stats.nextRank', { rank: t(`ranks.${nextRank.rank}`) })}
                </span>
              )}
            </div>
          </div>
          {nextRank && rankProgress && (
            <div className="stats-tab__rank-progress">
              <ProgressRing
                progress={rankProgress.progressPercent}
                size={80}
              />
              <div className="stats-tab__rank-requirements">
                {rankProgress.gamesNeeded > 0 && (
                  <span>{t('stats.gamesNeeded', { count: rankProgress.gamesNeeded })}</span>
                )}
                {rankProgress.solvesNeeded > 0 && (
                  <span>{t('stats.solvesNeeded', { count: rankProgress.solvesNeeded })}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Per-Game Breakdown */}
      <section className="stats-tab__section">
        <h2 className="stats-tab__heading">{t('stats.breakdown')}</h2>
        <div className="stats-tab__breakdown">
          <div className="stats-tab__game-row">
            <span className="stats-tab__game-name">{t('magicGraph:title')}</span>
            <span className="stats-tab__game-stat">{stats.magicGraphSolved} {t('stats.solves')}</span>
            <span className="stats-tab__game-stat">
              {stats.bestTimes.magicGraphFastest
                ? `${(stats.bestTimes.magicGraphFastest / 1000).toFixed(1)}s ${t('stats.best')}`
                : t('stats.noRecord')}
            </span>
          </div>
          <div className="stats-tab__game-row">
            <span className="stats-tab__game-name">{t('sequenceRace:title')}</span>
            <span className="stats-tab__game-stat">{stats.sequenceRaceWins} {t('stats.winsShort')}</span>
            <span className="stats-tab__game-stat">
              {stats.bestTimes.sequenceRaceFastest
                ? `${(stats.bestTimes.sequenceRaceFastest / 1000).toFixed(1)}s ${t('stats.best')}`
                : t('stats.noRecord')}
            </span>
          </div>
          <div className="stats-tab__game-row">
            <span className="stats-tab__game-name">{t('shapeArchitect:title')}</span>
            <span className="stats-tab__game-stat">{stats.shapeArchitectBuilt} {t('stats.built')}</span>
            <span className="stats-tab__game-stat">
              {stats.bestTimes.shapeArchitectFastest
                ? `${(stats.bestTimes.shapeArchitectFastest / 1000).toFixed(1)}s ${t('stats.best')}`
                : t('stats.noRecord')}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

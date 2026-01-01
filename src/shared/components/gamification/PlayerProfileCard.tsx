/**
 * Player Profile Card Component
 * Dashboard section showing player info, rank, stats, streak, and achievements
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlayerProfile, Achievement } from '../../services';
import type { RankThreshold } from '../../services/rank';
import './PlayerProfileCard.css';

interface PlayerProfileCardProps {
  profile: PlayerProfile;
  rankInfo: RankThreshold;
  nextRank: RankThreshold | null;
  rankProgress: { gamesNeeded: number; solvesNeeded: number; progressPercent: number } | null;
  recentAchievements: Achievement[];
  onUpdateName: (name: string) => void;
  className?: string;
}

export function PlayerProfileCard({
  profile,
  rankInfo,
  nextRank,
  rankProgress,
  recentAchievements,
  onUpdateName,
  className = '',
}: PlayerProfileCardProps) {
  const { t } = useTranslation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile.displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleStartEdit = () => {
    setEditedName(profile.displayName || t('player.defaultName'));
    setIsEditingName(true);
  };

  const handleSave = () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== profile.displayName) {
      onUpdateName(trimmed);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(profile.displayName);
      setIsEditingName(false);
    }
  };

  const displayName = profile.displayName || t('player.defaultName');

  return (
    <div className={`player-profile-card ${className}`}>
      {/* Left section: Rank Badge and Name */}
      <div className="player-profile-card__main">
        {/* Rank Badge */}
        <div className="player-profile-card__rank" title={t(rankInfo.displayNameKey)}>
          <span className="player-profile-card__rank-icon">{rankInfo.icon}</span>
        </div>

        {/* Name and Rank Title */}
        <div className="player-profile-card__info">
          {isEditingName ? (
            <input
              ref={inputRef}
              type="text"
              className="player-profile-card__name-input"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              maxLength={20}
              aria-label={t('player.displayName')}
            />
          ) : (
            <button
              className="player-profile-card__name"
              onClick={handleStartEdit}
              title={t('player.editName')}
            >
              {displayName}
              <span className="player-profile-card__edit-icon">✏️</span>
            </button>
          )}
          <span className="player-profile-card__title">
            {t(rankInfo.displayNameKey)}
          </span>
        </div>
      </div>

      {/* Middle section: Stats and Progress */}
      <div className="player-profile-card__progress">
        {/* Stats Summary */}
        <div className="player-profile-card__stats-row">
          <span className="player-profile-card__stat">
            {profile.stats.totalGamesPlayed} {t('stats.games')}
          </span>
          <span className="player-profile-card__stat-divider">•</span>
          <span className="player-profile-card__stat">
            {profile.stats.totalPuzzlesSolved} {t('stats.solved')}
          </span>
        </div>

        {/* Progress Bar to Next Rank */}
        {nextRank && rankProgress && (
          <div className="player-profile-card__rank-progress">
            <div className="player-profile-card__progress-bar">
              <div
                className="player-profile-card__progress-fill"
                style={{ width: `${rankProgress.progressPercent}%` }}
              />
            </div>
            <span className="player-profile-card__progress-label">
              {nextRank.icon} {t(nextRank.displayNameKey)}
            </span>
          </div>
        )}
      </div>

      {/* Right section: Streak and Achievements */}
      <div className="player-profile-card__meta">
        {/* Streak */}
        <div className="player-profile-card__streak" title={t('player.streak', { count: profile.streak })}>
          <span className="player-profile-card__streak-icon">🔥</span>
          <span className="player-profile-card__streak-count">{profile.streak}</span>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="player-profile-card__achievements">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="player-profile-card__achievement"
                title={t(achievement.nameKey)}
              >
                {achievement.icon}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerProfileCard;

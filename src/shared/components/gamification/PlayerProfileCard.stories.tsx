import type { Meta, StoryObj } from '@storybook/react';
import { PlayerProfileCard } from './PlayerProfileCard';
import type { PlayerProfile, Achievement } from '../../services';
import { getRankInfo, getNextRank, getRankProgress } from '../../services/rank';

const meta: Meta<typeof PlayerProfileCard> = {
  title: 'Gamification/PlayerProfileCard',
  component: PlayerProfileCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlayerProfileCard>;

const recentAchievements: Achievement[] = [
  {
    id: 'mg_first_solve',
    category: 'magic-graph',
    nameKey: 'achievements.mg_first_solve.name',
    descriptionKey: 'achievements.mg_first_solve.description',
    icon: '🌟',
    rarity: 'common',
  },
  {
    id: 'sr_first_victory',
    category: 'sequence-race',
    nameKey: 'achievements.sr_first_victory.name',
    descriptionKey: 'achievements.sr_first_victory.description',
    icon: '🏆',
    rarity: 'common',
  },
  {
    id: 'global_all_games',
    category: 'global',
    nameKey: 'achievements.global_all_games.name',
    descriptionKey: 'achievements.global_all_games.description',
    icon: '🎮',
    rarity: 'rare',
  },
];

const beginnerProfile: PlayerProfile = {
  id: 'player_123',
  displayName: 'Math Rookie',
  rank: 'beginner',
  streak: 1,
  lastPlayedDate: '2026-01-02',
  achievements: ['global_first_steps'],
  stats: {
    totalGamesPlayed: 2,
    totalPuzzlesSolved: 1,
    totalWins: 0,
    magicGraphSolved: 1,
    sequenceRaceWins: 0,
    shapeArchitectBuilt: 0,
    bestTimes: {
      magicGraphFastest: 120,
      sequenceRaceFastest: null,
      shapeArchitectFastest: null,
    },
  },
  preferences: {
    soundEnabled: true,
    practiceMode: false,
    language: 'en',
  },
  createdAt: '2026-01-01',
  version: 2,
};

const intermediateProfile: PlayerProfile = {
  id: 'player_456',
  displayName: 'Puzzle Solver',
  rank: 'intermediate',
  streak: 7,
  lastPlayedDate: '2026-01-02',
  achievements: ['global_first_steps', 'mg_first_solve', 'sr_first_victory', 'global_all_games'],
  stats: {
    totalGamesPlayed: 35,
    totalPuzzlesSolved: 25,
    totalWins: 15,
    magicGraphSolved: 15,
    sequenceRaceWins: 10,
    shapeArchitectBuilt: 10,
    bestTimes: {
      magicGraphFastest: 45,
      sequenceRaceFastest: 60,
      shapeArchitectFastest: 75,
    },
  },
  preferences: {
    soundEnabled: true,
    practiceMode: false,
    language: 'en',
  },
  createdAt: '2025-12-01',
  version: 2,
};

const grandmasterProfile: PlayerProfile = {
  id: 'player_789',
  displayName: 'Math Legend',
  rank: 'grandmaster',
  streak: 42,
  lastPlayedDate: '2026-01-02',
  achievements: [
    'global_first_steps',
    'global_all_games',
    'global_streak_30',
    'global_grandmaster',
    'mg_first_solve',
    'mg_grandmaster',
    'sr_first_victory',
    'sr_hard_winner',
    'sa_first_build',
    'sa_master_architect',
  ],
  stats: {
    totalGamesPlayed: 520,
    totalPuzzlesSolved: 320,
    totalWins: 200,
    magicGraphSolved: 150,
    sequenceRaceWins: 120,
    shapeArchitectBuilt: 170,
    bestTimes: {
      magicGraphFastest: 15,
      sequenceRaceFastest: 20,
      shapeArchitectFastest: 25,
    },
  },
  preferences: {
    soundEnabled: true,
    practiceMode: false,
    language: 'en',
  },
  createdAt: '2025-06-01',
  version: 2,
};

const emptyNameProfile: PlayerProfile = {
  ...beginnerProfile,
  displayName: '',
};

export const Beginner: Story = {
  args: {
    profile: beginnerProfile,
    rankInfo: getRankInfo('beginner'),
    nextRank: getNextRank('beginner'),
    rankProgress: getRankProgress(beginnerProfile.stats, 'beginner'),
    recentAchievements: [recentAchievements[0]],
    onUpdateName: (name: string) => console.log('Update name:', name),
  },
};

export const Intermediate: Story = {
  args: {
    profile: intermediateProfile,
    rankInfo: getRankInfo('intermediate'),
    nextRank: getNextRank('intermediate'),
    rankProgress: getRankProgress(intermediateProfile.stats, 'intermediate'),
    recentAchievements: recentAchievements,
    onUpdateName: (name: string) => console.log('Update name:', name),
  },
};

export const Grandmaster: Story = {
  args: {
    profile: grandmasterProfile,
    rankInfo: getRankInfo('grandmaster'),
    nextRank: getNextRank('grandmaster'),
    rankProgress: getRankProgress(grandmasterProfile.stats, 'grandmaster'),
    recentAchievements: recentAchievements,
    onUpdateName: (name: string) => console.log('Update name:', name),
  },
};

export const NoStreak: Story = {
  args: {
    profile: { ...intermediateProfile, streak: 0 },
    rankInfo: getRankInfo('intermediate'),
    nextRank: getNextRank('intermediate'),
    rankProgress: getRankProgress(intermediateProfile.stats, 'intermediate'),
    recentAchievements: recentAchievements,
    onUpdateName: (name: string) => console.log('Update name:', name),
  },
};

export const NoAchievements: Story = {
  args: {
    profile: beginnerProfile,
    rankInfo: getRankInfo('beginner'),
    nextRank: getNextRank('beginner'),
    rankProgress: getRankProgress(beginnerProfile.stats, 'beginner'),
    recentAchievements: [],
    onUpdateName: (name: string) => console.log('Update name:', name),
  },
};

export const EmptyDisplayName: Story = {
  args: {
    profile: emptyNameProfile,
    rankInfo: getRankInfo('beginner'),
    nextRank: getNextRank('beginner'),
    rankProgress: getRankProgress(beginnerProfile.stats, 'beginner'),
    recentAchievements: [],
    onUpdateName: (name: string) => console.log('Update name:', name),
  },
};

export const LongDisplayName: Story = {
  args: {
    profile: { ...intermediateProfile, displayName: 'SuperDuperMathWizardExtraordinaire' },
    rankInfo: getRankInfo('intermediate'),
    nextRank: getNextRank('intermediate'),
    rankProgress: getRankProgress(intermediateProfile.stats, 'intermediate'),
    recentAchievements: recentAchievements,
    onUpdateName: (name: string) => console.log('Update name:', name),
  },
};

export const HighStreak: Story = {
  args: {
    profile: { ...intermediateProfile, streak: 99 },
    rankInfo: getRankInfo('intermediate'),
    nextRank: getNextRank('intermediate'),
    rankProgress: getRankProgress(intermediateProfile.stats, 'intermediate'),
    recentAchievements: recentAchievements,
    onUpdateName: (name: string) => console.log('Update name:', name),
  },
};

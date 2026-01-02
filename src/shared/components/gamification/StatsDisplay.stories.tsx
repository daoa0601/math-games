import type { Meta, StoryObj } from '@storybook/react';
import { StatsDisplay } from './StatsDisplay';
import type { PlayerStats } from '../../services/player';

const meta: Meta<typeof StatsDisplay> = {
  title: 'Gamification/StatsDisplay',
  component: StatsDisplay,
  tags: ['autodocs'],
  argTypes: {
    showRank: { control: 'boolean' },
    showProgress: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['compact', 'detailed'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatsDisplay>;

const beginnerStats: PlayerStats = {
  totalGamesPlayed: 0,
  totalPuzzlesSolved: 0,
  totalWins: 0,
  magicGraphSolved: 0,
  sequenceRaceWins: 0,
  shapeArchitectBuilt: 0,
  bestTimes: {
    magicGraphFastest: null,
    sequenceRaceFastest: null,
    shapeArchitectFastest: null,
  },
};

const learnerStats: PlayerStats = {
  totalGamesPlayed: 7,
  totalPuzzlesSolved: 5,
  totalWins: 2,
  magicGraphSolved: 3,
  sequenceRaceWins: 2,
  shapeArchitectBuilt: 2,
  bestTimes: {
    magicGraphFastest: 45,
    sequenceRaceFastest: 60,
    shapeArchitectFastest: 90,
  },
};

const intermediateStats: PlayerStats = {
  totalGamesPlayed: 35,
  totalPuzzlesSolved: 25,
  totalWins: 15,
  magicGraphSolved: 15,
  sequenceRaceWins: 10,
  shapeArchitectBuilt: 10,
  bestTimes: {
    magicGraphFastest: 30,
    sequenceRaceFastest: 45,
    shapeArchitectFastest: 60,
  },
};

const grandmasterStats: PlayerStats = {
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
};

export const BeginnerCompact: Story = {
  args: {
    stats: beginnerStats,
    rank: 'beginner',
    variant: 'compact',
    showRank: true,
    showProgress: true,
  },
};

export const BeginnerDetailed: Story = {
  args: {
    stats: beginnerStats,
    rank: 'beginner',
    variant: 'detailed',
    showRank: true,
    showProgress: true,
  },
};

export const LearnerCompact: Story = {
  args: {
    stats: learnerStats,
    rank: 'learner',
    variant: 'compact',
    showRank: true,
    showProgress: true,
  },
};

export const LearnerDetailed: Story = {
  args: {
    stats: learnerStats,
    rank: 'learner',
    variant: 'detailed',
    showRank: true,
    showProgress: true,
  },
};

export const IntermediateCompact: Story = {
  args: {
    stats: intermediateStats,
    rank: 'intermediate',
    variant: 'compact',
    showRank: true,
    showProgress: true,
  },
};

export const IntermediateDetailed: Story = {
  args: {
    stats: intermediateStats,
    rank: 'intermediate',
    variant: 'detailed',
    showRank: true,
    showProgress: true,
  },
};

export const GrandmasterCompact: Story = {
  args: {
    stats: grandmasterStats,
    rank: 'grandmaster',
    variant: 'compact',
    showRank: true,
    showProgress: false, // No next rank for grandmaster
  },
};

export const GrandmasterDetailed: Story = {
  args: {
    stats: grandmasterStats,
    rank: 'grandmaster',
    variant: 'detailed',
    showRank: true,
    showProgress: false,
  },
};

export const NoRankDisplay: Story = {
  args: {
    stats: intermediateStats,
    rank: 'intermediate',
    variant: 'compact',
    showRank: false,
    showProgress: true,
  },
};

export const NoProgressDisplay: Story = {
  args: {
    stats: intermediateStats,
    rank: 'intermediate',
    variant: 'compact',
    showRank: true,
    showProgress: false,
  },
};

export const AllRanks: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <StatsDisplay stats={beginnerStats} rank="beginner" variant="compact" />
      <StatsDisplay stats={learnerStats} rank="learner" variant="compact" />
      <StatsDisplay stats={{ ...learnerStats, totalGamesPlayed: 18, totalPuzzlesSolved: 12 }} rank="apprentice" variant="compact" />
      <StatsDisplay stats={intermediateStats} rank="intermediate" variant="compact" />
      <StatsDisplay stats={{ ...intermediateStats, totalGamesPlayed: 65, totalPuzzlesSolved: 45 }} rank="advanced" variant="compact" />
      <StatsDisplay stats={{ ...intermediateStats, totalGamesPlayed: 120, totalPuzzlesSolved: 85 }} rank="expert" variant="compact" />
      <StatsDisplay stats={{ ...grandmasterStats, totalGamesPlayed: 220, totalPuzzlesSolved: 160 }} rank="master" variant="compact" />
      <StatsDisplay stats={grandmasterStats} rank="grandmaster" variant="compact" />
    </div>
  ),
};

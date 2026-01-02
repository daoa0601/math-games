import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { DailyChallenge } from './DailyChallenge';
import { DAILY_CHALLENGE_KEY } from '../../constants';

/**
 * DailyChallenge displays today's challenges with completion status and streaks.
 * Stories mock localStorage to show different states.
 */
const meta: Meta<typeof DailyChallenge> = {
  title: 'Components/DailyChallenge',
  component: DailyChallenge,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '2rem',
          background: 'hsl(240, 10%, 8%)',
          minHeight: '400px',
          borderRadius: '8px',
        }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DailyChallenge>;

// Helper to get today's date string (matches getTodaySeed format)
const getTodayString = () => new Date().toISOString().split('T')[0];

type GameId = 'magic-graph' | 'sequence-race' | 'shape-architect';

interface GameStreak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

interface DailyChallengeCompletion {
  date: string;
  gameId: GameId;
  completed: boolean;
  timeSeconds: number;
}

interface DailyChallengeState {
  completions: DailyChallengeCompletion[];
  streaks: Record<GameId, GameStreak>;
  version: number;
}

// Helper to set up localStorage for a story
const setupMockStorage = (
  completedGames: GameId[],
  streaks: Partial<Record<GameId, { currentStreak: number; longestStreak: number }>>
) => {
  const today = getTodayString();

  const defaultStreak: GameStreak = {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
  };

  const state: DailyChallengeState = {
    completions: completedGames.map((gameId) => ({
      date: today,
      gameId,
      completed: true,
      timeSeconds: gameId === 'magic-graph' ? 45 : gameId === 'sequence-race' ? 120 : 89,
    })),
    streaks: {
      'magic-graph': streaks['magic-graph']
        ? { ...streaks['magic-graph'], lastCompletedDate: today }
        : defaultStreak,
      'sequence-race': streaks['sequence-race']
        ? { ...streaks['sequence-race'], lastCompletedDate: today }
        : defaultStreak,
      'shape-architect': streaks['shape-architect']
        ? { ...streaks['shape-architect'], lastCompletedDate: today }
        : defaultStreak,
    },
    version: 1,
  };

  localStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(state));
};

const clearStorage = () => {
  localStorage.removeItem(DAILY_CHALLENGE_KEY);
};

export const AllIncomplete: Story = {
  decorators: [
    (Story) => {
      clearStorage();
      return <Story />;
    },
  ],
};

export const OneCompleted: Story = {
  decorators: [
    (Story) => {
      setupMockStorage(['magic-graph'], {
        'magic-graph': { currentStreak: 3, longestStreak: 5 },
      });
      return <Story />;
    },
  ],
};

export const TwoCompleted: Story = {
  decorators: [
    (Story) => {
      setupMockStorage(['magic-graph', 'sequence-race'], {
        'magic-graph': { currentStreak: 3, longestStreak: 5 },
        'sequence-race': { currentStreak: 7, longestStreak: 10 },
      });
      return <Story />;
    },
  ],
};

export const AllCompleted: Story = {
  decorators: [
    (Story) => {
      setupMockStorage(['magic-graph', 'sequence-race', 'shape-architect'], {
        'magic-graph': { currentStreak: 10, longestStreak: 15 },
        'sequence-race': { currentStreak: 7, longestStreak: 10 },
        'shape-architect': { currentStreak: 5, longestStreak: 8 },
      });
      return <Story />;
    },
  ],
};

export const HighStreaks: Story = {
  decorators: [
    (Story) => {
      setupMockStorage(['magic-graph'], {
        'magic-graph': { currentStreak: 30, longestStreak: 30 },
        'sequence-race': { currentStreak: 15, longestStreak: 20 },
        'shape-architect': { currentStreak: 7, longestStreak: 12 },
      });
      return <Story />;
    },
  ],
};

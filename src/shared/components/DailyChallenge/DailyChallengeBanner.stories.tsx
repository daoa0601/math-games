import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { DailyChallengeBanner } from './DailyChallengeBanner';
import { DAILY_CHALLENGE_KEY } from '../../constants';

/**
 * DailyChallengeBanner is a compact banner showing daily challenge progress.
 * Stories mock localStorage to show different completion states.
 */
const meta: Meta<typeof DailyChallengeBanner> = {
  title: 'Components/DailyChallengeBanner',
  component: DailyChallengeBanner,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem',
          background: 'hsl(240, 10%, 8%)',
          minHeight: '200px',
          borderRadius: '8px',
        }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    countdown: {
      control: 'text',
      description: 'Countdown string to display (e.g., "23:45:12")',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DailyChallengeBanner>;

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
const setupMockStorage = (completedGames: GameId[]) => {
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
      'magic-graph': defaultStreak,
      'sequence-race': defaultStreak,
      'shape-architect': defaultStreak,
    },
    version: 1,
  };

  localStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(state));
};

const clearStorage = () => {
  localStorage.removeItem(DAILY_CHALLENGE_KEY);
};

export const NoGamesCompleted: Story = {
  args: {
    countdown: '23:45:12',
  },
  decorators: [
    (Story) => {
      clearStorage();
      return <Story />;
    },
  ],
};

export const OneGameCompleted: Story = {
  args: {
    countdown: '18:30:45',
  },
  decorators: [
    (Story) => {
      setupMockStorage(['magic-graph']);
      return <Story />;
    },
  ],
};

export const TwoGamesCompleted: Story = {
  args: {
    countdown: '12:15:30',
  },
  decorators: [
    (Story) => {
      setupMockStorage(['magic-graph', 'sequence-race']);
      return <Story />;
    },
  ],
};

export const AllGamesCompleted: Story = {
  args: {
    countdown: '06:00:00',
  },
  decorators: [
    (Story) => {
      setupMockStorage(['magic-graph', 'sequence-race', 'shape-architect']);
      return <Story />;
    },
  ],
};

export const AlmostMidnight: Story = {
  args: {
    countdown: '00:05:23',
  },
  decorators: [
    (Story) => {
      setupMockStorage(['magic-graph']);
      return <Story />;
    },
  ],
};

export const JustStartedDay: Story = {
  args: {
    countdown: '23:59:59',
  },
  decorators: [
    (Story) => {
      clearStorage();
      return <Story />;
    },
  ],
};

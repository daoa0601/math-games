import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AchievementsGallery } from './AchievementsGallery';

const meta: Meta<typeof AchievementsGallery> = {
  title: 'Gamification/AchievementsGallery',
  component: AchievementsGallery,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AchievementsGallery>;

// Interactive wrapper to handle toggle state
function GalleryWithState({ unlockedAchievementIds }: { unlockedAchievementIds: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <AchievementsGallery
      unlockedAchievementIds={unlockedAchievementIds}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    />
  );
}

export const NoAchievements: Story = {
  render: () => <GalleryWithState unlockedAchievementIds={[]} />,
};

export const OneAchievement: Story = {
  render: () => <GalleryWithState unlockedAchievementIds={['global_first_steps']} />,
};

export const FewAchievements: Story = {
  render: () => (
    <GalleryWithState
      unlockedAchievementIds={[
        'global_first_steps',
        'mg_first_solve',
        'sr_first_victory',
      ]}
    />
  ),
};

export const MostlyUnlocked: Story = {
  render: () => (
    <GalleryWithState
      unlockedAchievementIds={[
        'global_first_steps',
        'global_all_games',
        'global_streak_30',
        'mg_first_solve',
        'mg_grandmaster',
        'sr_first_victory',
        'sr_hard_winner',
        'sa_first_build',
      ]}
    />
  ),
};

export const AllAchievements: Story = {
  render: () => (
    <GalleryWithState
      unlockedAchievementIds={[
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
      ]}
    />
  ),
};

export const GlobalOnly: Story = {
  render: () => (
    <GalleryWithState
      unlockedAchievementIds={[
        'global_first_steps',
        'global_all_games',
        'global_streak_30',
        'global_grandmaster',
      ]}
    />
  ),
};

export const MagicGraphOnly: Story = {
  render: () => (
    <GalleryWithState
      unlockedAchievementIds={['mg_first_solve', 'mg_grandmaster']}
    />
  ),
};

export const SequenceRaceOnly: Story = {
  render: () => (
    <GalleryWithState
      unlockedAchievementIds={['sr_first_victory', 'sr_hard_winner']}
    />
  ),
};

export const ShapeArchitectOnly: Story = {
  render: () => (
    <GalleryWithState
      unlockedAchievementIds={['sa_first_build', 'sa_master_architect']}
    />
  ),
};

export const Collapsed: Story = {
  args: {
    unlockedAchievementIds: [
      'global_first_steps',
      'global_all_games',
      'mg_first_solve',
      'sr_first_victory',
    ],
    isExpanded: false,
    onToggle: () => console.log('Toggle clicked'),
  },
};

export const Expanded: Story = {
  args: {
    unlockedAchievementIds: [
      'global_first_steps',
      'global_all_games',
      'mg_first_solve',
      'sr_first_victory',
    ],
    isExpanded: true,
    onToggle: () => console.log('Toggle clicked'),
  },
};

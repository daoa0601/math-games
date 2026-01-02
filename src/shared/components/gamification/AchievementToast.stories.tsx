import type { Meta, StoryObj } from '@storybook/react';
import { AchievementToast } from './AchievementToast';
import type { Achievement } from '../../services';

const meta: Meta<typeof AchievementToast> = {
  title: 'Gamification/AchievementToast',
  component: AchievementToast,
  tags: ['autodocs'],
  argTypes: {
    duration: { control: 'number' },
    delay: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof AchievementToast>;

const commonAchievement: Achievement = {
  id: 'mg_first_solve',
  category: 'magic-graph',
  nameKey: 'achievements.mg_first_solve.name',
  descriptionKey: 'achievements.mg_first_solve.description',
  icon: '🌟',
  rarity: 'common',
};

const rareAchievement: Achievement = {
  id: 'global_all_games',
  category: 'global',
  nameKey: 'achievements.global_all_games.name',
  descriptionKey: 'achievements.global_all_games.description',
  icon: '🎮',
  rarity: 'rare',
};

const epicAchievement: Achievement = {
  id: 'mg_grandmaster',
  category: 'magic-graph',
  nameKey: 'achievements.mg_grandmaster.name',
  descriptionKey: 'achievements.mg_grandmaster.description',
  icon: '👑',
  rarity: 'epic',
};

const legendaryAchievement: Achievement = {
  id: 'global_grandmaster',
  category: 'global',
  nameKey: 'achievements.global_grandmaster.name',
  descriptionKey: 'achievements.global_grandmaster.description',
  icon: '🌟',
  rarity: 'legendary',
};

export const Common: Story = {
  args: {
    achievement: commonAchievement,
    onClose: () => console.log('Toast closed'),
    duration: 10000, // Extended for Storybook viewing
    delay: 0,
  },
};

export const Rare: Story = {
  args: {
    achievement: rareAchievement,
    onClose: () => console.log('Toast closed'),
    duration: 10000,
    delay: 0,
  },
};

export const Epic: Story = {
  args: {
    achievement: epicAchievement,
    onClose: () => console.log('Toast closed'),
    duration: 10000,
    delay: 0,
  },
};

export const Legendary: Story = {
  args: {
    achievement: legendaryAchievement,
    onClose: () => console.log('Toast closed'),
    duration: 10000,
    delay: 0,
  },
};

export const MagicGraphFirstSolve: Story = {
  args: {
    achievement: {
      id: 'mg_first_solve',
      category: 'magic-graph',
      nameKey: 'achievements.mg_first_solve.name',
      descriptionKey: 'achievements.mg_first_solve.description',
      icon: '🌟',
      rarity: 'common',
    },
    onClose: () => console.log('Toast closed'),
    duration: 10000,
  },
};

export const SequenceRaceFirstVictory: Story = {
  args: {
    achievement: {
      id: 'sr_first_victory',
      category: 'sequence-race',
      nameKey: 'achievements.sr_first_victory.name',
      descriptionKey: 'achievements.sr_first_victory.description',
      icon: '🏆',
      rarity: 'common',
    },
    onClose: () => console.log('Toast closed'),
    duration: 10000,
  },
};

export const ShapeArchitectMaster: Story = {
  args: {
    achievement: {
      id: 'sa_master_architect',
      category: 'shape-architect',
      nameKey: 'achievements.sa_master_architect.name',
      descriptionKey: 'achievements.sa_master_architect.description',
      icon: '🏛️',
      rarity: 'epic',
    },
    onClose: () => console.log('Toast closed'),
    duration: 10000,
  },
};

export const Streak30: Story = {
  args: {
    achievement: {
      id: 'global_streak_30',
      category: 'global',
      nameKey: 'achievements.global_streak_30.name',
      descriptionKey: 'achievements.global_streak_30.description',
      icon: '🌋',
      rarity: 'epic',
    },
    onClose: () => console.log('Toast closed'),
    duration: 10000,
  },
};

export const StaggeredToasts: Story = {
  render: () => {
    const achievements = [commonAchievement, rareAchievement, epicAchievement];
    return (
      <div>
        {achievements.map((achievement, index) => (
          <AchievementToast
            key={achievement.id}
            achievement={achievement}
            onClose={() => console.log(`Toast ${achievement.id} closed`)}
            duration={10000}
            delay={index * 500}
          />
        ))}
      </div>
    );
  },
};

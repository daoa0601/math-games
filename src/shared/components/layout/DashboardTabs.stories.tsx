import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DashboardTabs, type DashboardTabId } from './DashboardTabs';

const meta: Meta<typeof DashboardTabs> = {
  title: 'Layout/DashboardTabs',
  component: DashboardTabs,
  tags: ['autodocs'],
  argTypes: {
    activeTab: {
      control: 'select',
      options: ['play', 'stats', 'achievements'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardTabs>;

export const Default: Story = {
  args: {
    activeTab: 'play',
    achievementCount: { unlocked: 3, total: 10 },
    onTabChange: (tab) => console.log('Tab changed to:', tab),
  },
};

export const StatsTab: Story = {
  args: {
    activeTab: 'stats',
    achievementCount: { unlocked: 5, total: 10 },
    onTabChange: (tab) => console.log('Tab changed to:', tab),
  },
};

export const AchievementsTab: Story = {
  args: {
    activeTab: 'achievements',
    achievementCount: { unlocked: 7, total: 10 },
    onTabChange: (tab) => console.log('Tab changed to:', tab),
  },
};

export const NoAchievements: Story = {
  args: {
    activeTab: 'achievements',
    achievementCount: { unlocked: 0, total: 10 },
    onTabChange: (tab) => console.log('Tab changed to:', tab),
  },
};

export const AllUnlocked: Story = {
  args: {
    activeTab: 'achievements',
    achievementCount: { unlocked: 10, total: 10 },
    onTabChange: (tab) => console.log('Tab changed to:', tab),
  },
};

// Wrapper component to properly use hooks in Storybook
function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<DashboardTabId>('play');

  return (
    <div>
      <DashboardTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        achievementCount={{ unlocked: 5, total: 10 }}
      />
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Current tab: <strong>{activeTab}</strong></p>
      </div>
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

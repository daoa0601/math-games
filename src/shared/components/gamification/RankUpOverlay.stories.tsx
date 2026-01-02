import type { Meta, StoryObj } from '@storybook/react';
import { RankUpOverlay } from './RankUpOverlay';

const meta: Meta<typeof RankUpOverlay> = {
  title: 'Gamification/RankUpOverlay',
  component: RankUpOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RankUpOverlay>;

export const BeginnerToLearner: Story = {
  args: {
    previousRank: 'beginner',
    newRank: 'learner',
    onClose: () => console.log('Overlay closed'),
  },
};

export const LearnerToApprentice: Story = {
  args: {
    previousRank: 'learner',
    newRank: 'apprentice',
    onClose: () => console.log('Overlay closed'),
  },
};

export const ApprenticeToIntermediate: Story = {
  args: {
    previousRank: 'apprentice',
    newRank: 'intermediate',
    onClose: () => console.log('Overlay closed'),
  },
};

export const IntermediateToAdvanced: Story = {
  args: {
    previousRank: 'intermediate',
    newRank: 'advanced',
    onClose: () => console.log('Overlay closed'),
  },
};

export const AdvancedToExpert: Story = {
  args: {
    previousRank: 'advanced',
    newRank: 'expert',
    onClose: () => console.log('Overlay closed'),
  },
};

export const ExpertToMaster: Story = {
  args: {
    previousRank: 'expert',
    newRank: 'master',
    onClose: () => console.log('Overlay closed'),
  },
};

export const MasterToGrandmaster: Story = {
  args: {
    previousRank: 'master',
    newRank: 'grandmaster',
    onClose: () => console.log('Overlay closed'),
  },
};

export const BigJump: Story = {
  args: {
    previousRank: 'beginner',
    newRank: 'intermediate',
    onClose: () => console.log('Overlay closed'),
  },
};

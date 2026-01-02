import type { Meta, StoryObj } from '@storybook/react';
import { HelpButton } from './HelpButton';

const meta: Meta<typeof HelpButton> = {
  title: 'Components/HelpButton',
  component: HelpButton,
  tags: ['autodocs'],
  argTypes: {
    gameId: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HelpButton>;

export const Default: Story = {
  args: {
    gameId: 'magic-graph',
    onShowTutorial: () => console.log('Show tutorial clicked'),
  },
};

export const SequenceRace: Story = {
  args: {
    gameId: 'sequence-race',
    onShowTutorial: () => console.log('Show tutorial for Sequence Race'),
  },
};

export const ShapeArchitect: Story = {
  args: {
    gameId: 'shape-architect',
    onShowTutorial: () => console.log('Show tutorial for Shape Architect'),
  },
};

export const InHeader: Story = {
  render: (args) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      background: 'var(--color-surface)',
      borderRadius: '8px'
    }}>
      <h2 style={{ margin: 0 }}>Game Title</h2>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <HelpButton {...args} />
        <button>⚙️</button>
      </div>
    </div>
  ),
  args: {
    gameId: 'magic-graph',
    onShowTutorial: () => console.log('Show tutorial clicked'),
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { GameLayout } from './GameLayout';
import { SoundToggle } from '@/shared/components/SoundToggle';

const meta: Meta<typeof GameLayout> = {
  title: 'Layout/GameLayout',
  component: GameLayout,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GameLayout>;

export const Default: Story = {
  args: {
    title: 'Magic Graph',
    children: (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Game content goes here</p>
      </div>
    ),
  },
};

export const WithHeaderRight: Story = {
  args: {
    title: 'Sequence Race',
    headerRight: <SoundToggle />,
    children: (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Game content with sound toggle in header</p>
      </div>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Very Long Game Title That Should Wrap Properly',
    children: (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Game content with long title</p>
      </div>
    ),
  },
};

export const WithComplexContent: Story = {
  args: {
    title: 'Shape Architect',
    headerRight: <SoundToggle />,
    children: (
      <div style={{ padding: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <h3>Controls</h3>
            <p>WASD to move</p>
          </div>
          <div style={{
            padding: '1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <h3>Stats</h3>
            <p>Score: 100</p>
          </div>
          <div style={{
            padding: '1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <h3>Timer</h3>
            <p>02:30</p>
          </div>
        </div>
      </div>
    ),
  },
};

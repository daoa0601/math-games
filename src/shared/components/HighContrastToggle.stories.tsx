import type { Meta, StoryObj } from '@storybook/react';
import { HighContrastToggle } from './HighContrastToggle';

const meta: Meta<typeof HighContrastToggle> = {
  title: 'Components/Settings/HighContrastToggle',
  component: HighContrastToggle,
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HighContrastToggle>;

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  args: {
    className: 'custom-toggle',
  },
};

export const InGroup: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      padding: '1rem',
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <span>Accessibility:</span>
      <HighContrastToggle />
    </div>
  ),
};

export const InSettingsPanel: Story = {
  render: () => (
    <div style={{
      padding: '1.5rem',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      maxWidth: '400px'
    }}>
      <h3 style={{ marginTop: 0 }}>Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <label htmlFor="high-contrast">High Contrast Mode</label>
          <HighContrastToggle />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <label htmlFor="sound">Sound Effects</label>
          <button>🔊</button>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <label htmlFor="language">Language</label>
          <button>🇬🇧 EN</button>
        </div>
      </div>
    </div>
  ),
};

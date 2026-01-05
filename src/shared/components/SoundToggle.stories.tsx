import type { Meta, StoryObj } from '@storybook/react';
import { SoundToggle } from './SoundToggle';

const meta: Meta<typeof SoundToggle> = {
  title: 'Components/Settings/SoundToggle',
  component: SoundToggle,
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Animated sound toggle button with speaker icon and sound waves. Persists preference to localStorage.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SoundToggle>;

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  args: {
    className: 'custom-sound-toggle',
  },
};

export const InHeader: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <h2 style={{ margin: 0 }}>Game Title</h2>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <SoundToggle />
        <button>⚙️</button>
      </div>
    </div>
  ),
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
      <span>Audio:</span>
      <SoundToggle />
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
          <label htmlFor="sound">Sound Effects</label>
          <SoundToggle />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <label htmlFor="language">Language</label>
          <button>🇬🇧 EN</button>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <label htmlFor="high-contrast">High Contrast</label>
          <button>◐</button>
        </div>
      </div>
    </div>
  ),
};

export const MultipleInstances: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      gap: '1rem',
      padding: '1rem',
      alignItems: 'center'
    }}>
      <SoundToggle />
      <SoundToggle />
      <SoundToggle />
      <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginLeft: '1rem' }}>
        All instances share the same localStorage state
      </p>
    </div>
  ),
};

export const AllSettings: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '1rem',
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <SoundToggle />
      <button className="lang-switcher">🇬🇧 EN</button>
      <button className="high-contrast-toggle">◐</button>
    </div>
  ),
};

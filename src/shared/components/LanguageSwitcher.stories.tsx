import type { Meta, StoryObj } from '@storybook/react';
import { LanguageSwitcher } from './LanguageSwitcher';

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Components/Settings/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Toggles between English (EN) and Vietnamese (VI) languages. The current language is stored in localStorage.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageSwitcher>;

export const Default: Story = {
  args: {},
};

export const InHeader: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      background: 'var(--color-surface)',
      borderRadius: '8px'
    }}>
      <h2 style={{ margin: 0 }}>Math Games</h2>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <LanguageSwitcher />
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
      background: 'var(--color-surface)',
      borderRadius: '8px'
    }}>
      <span>Language:</span>
      <LanguageSwitcher />
    </div>
  ),
};

export const InSettingsPanel: Story = {
  render: () => (
    <div style={{
      padding: '1.5rem',
      background: 'var(--color-surface)',
      borderRadius: '8px',
      maxWidth: '400px'
    }}>
      <h3 style={{ marginTop: 0 }}>Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <label>Language</label>
          <LanguageSwitcher />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <label>Sound Effects</label>
          <button>🔊</button>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <label>High Contrast</label>
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
      flexDirection: 'column',
      gap: '1rem',
      padding: '1rem'
    }}>
      <div>
        <p>Instance 1:</p>
        <LanguageSwitcher />
      </div>
      <div>
        <p>Instance 2:</p>
        <LanguageSwitcher />
      </div>
      <div>
        <p>Instance 3:</p>
        <LanguageSwitcher />
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        All instances are synchronized through i18next
      </p>
    </div>
  ),
};

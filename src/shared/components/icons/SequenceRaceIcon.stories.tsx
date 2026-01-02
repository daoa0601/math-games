import type { Meta, StoryObj } from '@storybook/react'
import { SequenceRaceIcon } from './SequenceRaceIcon'

const meta: Meta<typeof SequenceRaceIcon> = {
  title: 'Components/Icons/SequenceRaceIcon',
  component: SequenceRaceIcon,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'number', min: 16, max: 256, step: 8 },
      description: 'Icon size in pixels',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof SequenceRaceIcon>

export const Default: Story = {
  args: {
    size: 64,
  },
}

export const Small: Story = {
  args: {
    size: 32,
  },
}

export const Medium: Story = {
  args: {
    size: 64,
  },
}

export const Large: Story = {
  args: {
    size: 128,
  },
}

export const ExtraLarge: Story = {
  args: {
    size: 256,
  },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}>
        <SequenceRaceIcon size={24} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>24px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <SequenceRaceIcon size={32} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>32px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <SequenceRaceIcon size={48} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>48px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <SequenceRaceIcon size={64} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>64px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <SequenceRaceIcon size={96} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>96px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <SequenceRaceIcon size={128} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>128px</p>
      </div>
    </div>
  ),
}

export const WithCustomClass: Story = {
  args: {
    size: 64,
    className: 'custom-icon-class',
  },
}

export const OnDarkBackground: Story = {
  args: {
    size: 128,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '12px',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export const OnLightBackground: Story = {
  args: {
    size: 128,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          borderRadius: '12px',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export const AnimatedRunner: Story = {
  args: {
    size: 128,
  },
  parameters: {
    docs: {
      description: {
        story: 'The runner character includes animated arms and legs to show running motion.',
      },
    },
  },
}

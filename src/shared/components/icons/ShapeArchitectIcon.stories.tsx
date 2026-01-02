import type { Meta, StoryObj } from '@storybook/react'
import { ShapeArchitectIcon } from './ShapeArchitectIcon'

const meta: Meta<typeof ShapeArchitectIcon> = {
  title: 'Components/Icons/ShapeArchitectIcon',
  component: ShapeArchitectIcon,
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
type Story = StoryObj<typeof ShapeArchitectIcon>

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
        <ShapeArchitectIcon size={24} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>24px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ShapeArchitectIcon size={32} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>32px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ShapeArchitectIcon size={48} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>48px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ShapeArchitectIcon size={64} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>64px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ShapeArchitectIcon size={96} />
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>96px</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ShapeArchitectIcon size={128} />
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
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '12px',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export const AnimatedFloatingBlock: Story = {
  args: {
    size: 128,
  },
  parameters: {
    docs: {
      description: {
        story: 'The purple block at the top floats with a gentle animation to show it being placed.',
      },
    },
  },
}

export const IsometricBlocks: Story = {
  args: {
    size: 128,
  },
  parameters: {
    docs: {
      description: {
        story: 'The icon features an isometric 3D block stack with blueprint grid and builder character.',
      },
    },
  },
}

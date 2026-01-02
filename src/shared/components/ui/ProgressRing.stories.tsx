import type { Meta, StoryObj } from '@storybook/react'
import { ProgressRing, CompactProgressRing } from './ProgressRing'

const meta: Meta<typeof ProgressRing> = {
  title: 'Components/ProgressRing',
  component: ProgressRing,
  tags: ['autodocs'],
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress value (0-100)',
    },
    size: {
      control: { type: 'range', min: 30, max: 200, step: 10 },
      description: 'Size of the ring in pixels',
    },
    strokeWidth: {
      control: { type: 'range', min: 2, max: 20, step: 1 },
      description: 'Width of the progress stroke',
    },
    color: {
      control: 'color',
      description: 'Color of the progress ring',
    },
    backgroundColor: {
      control: 'color',
      description: 'Background circle color',
    },
    showPercentage: {
      control: 'boolean',
      description: 'Show percentage text in center',
    },
    label: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof ProgressRing>

export const Default: Story = {
  args: {
    progress: 65,
  },
}

export const Empty: Story = {
  args: {
    progress: 0,
  },
}

export const HalfWay: Story = {
  args: {
    progress: 50,
  },
}

export const AlmostComplete: Story = {
  args: {
    progress: 90,
  },
}

export const Complete: Story = {
  args: {
    progress: 100,
  },
}

export const WithoutPercentage: Story = {
  args: {
    progress: 75,
    showPercentage: false,
  },
}

export const CustomColor: Story = {
  args: {
    progress: 60,
    color: '#9333ea',
  },
}

export const SmallSize: Story = {
  args: {
    progress: 75,
    size: 40,
  },
}

export const LargeSize: Story = {
  args: {
    progress: 75,
    size: 120,
  },
}

export const ThickStroke: Story = {
  args: {
    progress: 65,
    strokeWidth: 12,
  },
}

export const ThinStroke: Story = {
  args: {
    progress: 65,
    strokeWidth: 3,
  },
}

export const WithLabel: Story = {
  args: {
    progress: 65,
    label: 'Task completion progress',
  },
}

export const AllProgressStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={0} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>0% - Primary</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={25} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>25% - Primary</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={50} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>50% - Warning</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={75} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>75% - Secondary</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={100} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>100% - Success</span>
      </div>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={65} size={40} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>40px</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={65} size={60} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>60px (default)</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={65} size={80} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>80px</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressRing progress={65} size={120} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>120px</span>
      </div>
    </div>
  ),
}

// CompactProgressRing stories
type CompactStory = StoryObj<typeof CompactProgressRing>

export const CompactDefault: CompactStory = {
  render: () => <CompactProgressRing completed={7} total={10} />,
  name: 'Compact - Default',
}

export const CompactEmpty: CompactStory = {
  render: () => <CompactProgressRing completed={0} total={10} />,
  name: 'Compact - Empty',
}

export const CompactComplete: CompactStory = {
  render: () => <CompactProgressRing completed={10} total={10} />,
  name: 'Compact - Complete',
}

export const CompactSmall: CompactStory = {
  render: () => <CompactProgressRing completed={5} total={8} size={36} />,
  name: 'Compact - Small Size',
}

export const CompactLarge: CompactStory = {
  render: () => <CompactProgressRing completed={5} total={8} size={64} />,
  name: 'Compact - Large Size',
}

export const CompactVariants: CompactStory = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <CompactProgressRing completed={0} total={10} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Not started</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <CompactProgressRing completed={3} total={10} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In progress</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <CompactProgressRing completed={7} total={10} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Almost done</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <CompactProgressRing completed={10} total={10} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Complete</span>
      </div>
    </div>
  ),
  name: 'Compact - All Variants',
}

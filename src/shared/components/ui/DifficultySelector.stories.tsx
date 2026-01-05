import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DifficultySelector } from './DifficultySelector'

type Difficulty = 'easy' | 'medium' | 'hard' | 'master' | 'grandmaster'

const meta: Meta<typeof DifficultySelector> = {
  title: 'Components/DifficultySelector',
  component: DifficultySelector,
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Available difficulty options',
    },
    value: {
      control: 'select',
      options: ['easy', 'medium', 'hard', 'master', 'grandmaster'],
      description: 'Currently selected difficulty',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when difficulty changes',
    },
  },
}

export default meta
type Story = StoryObj<typeof DifficultySelector>

// Interactive wrapper component for stories
function DifficultyWrapper({
  options,
  defaultValue,
}: {
  options: readonly Difficulty[]
  defaultValue: Difficulty
}) {
  const [difficulty, setDifficulty] = useState(defaultValue)
  return (
    <DifficultySelector
      options={options}
      value={difficulty}
      onChange={setDifficulty}
    />
  )
}

export const ThreeLevels: Story = {
  render: () => (
    <DifficultyWrapper
      options={['easy', 'medium', 'hard'] as const}
      defaultValue="easy"
    />
  ),
}

export const FiveLevels: Story = {
  render: () => (
    <DifficultyWrapper
      options={['easy', 'medium', 'hard', 'master', 'grandmaster'] as const}
      defaultValue="medium"
    />
  ),
}

export const EasySelected: Story = {
  render: () => (
    <DifficultyWrapper
      options={['easy', 'medium', 'hard'] as const}
      defaultValue="easy"
    />
  ),
}

export const MediumSelected: Story = {
  render: () => (
    <DifficultyWrapper
      options={['easy', 'medium', 'hard'] as const}
      defaultValue="medium"
    />
  ),
}

export const HardSelected: Story = {
  render: () => (
    <DifficultyWrapper
      options={['easy', 'medium', 'hard'] as const}
      defaultValue="hard"
    />
  ),
}

export const MasterSelected: Story = {
  render: () => (
    <DifficultyWrapper
      options={['easy', 'medium', 'hard', 'master', 'grandmaster'] as const}
      defaultValue="master"
    />
  ),
}

export const GrandmasterSelected: Story = {
  render: () => (
    <DifficultyWrapper
      options={['easy', 'medium', 'hard', 'master', 'grandmaster'] as const}
      defaultValue="grandmaster"
    />
  ),
}

export const TwoLevels: Story = {
  render: () => (
    <DifficultyWrapper
      options={['easy', 'hard'] as const}
      defaultValue="easy"
    />
  ),
}

export const AdvancedOnly: Story = {
  render: () => (
    <DifficultyWrapper
      options={['hard', 'master', 'grandmaster'] as const}
      defaultValue="hard"
    />
  ),
}

export const AllDifficulties: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>
          Standard (3 levels)
        </h3>
        <DifficultyWrapper
          options={['easy', 'medium', 'hard'] as const}
          defaultValue="medium"
        />
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>
          Extended (5 levels)
        </h3>
        <DifficultyWrapper
          options={['easy', 'medium', 'hard', 'master', 'grandmaster'] as const}
          defaultValue="hard"
        />
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>
          Simple (2 levels)
        </h3>
        <DifficultyWrapper
          options={['easy', 'hard'] as const}
          defaultValue="easy"
        />
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>
          Advanced Only
        </h3>
        <DifficultyWrapper
          options={['hard', 'master', 'grandmaster'] as const}
          defaultValue="master"
        />
      </div>
    </div>
  ),
}

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <p style={{ marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
          Easy selected
        </p>
        <DifficultyWrapper
          options={['easy', 'medium', 'hard'] as const}
          defaultValue="easy"
        />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
          Medium selected
        </p>
        <DifficultyWrapper
          options={['easy', 'medium', 'hard'] as const}
          defaultValue="medium"
        />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
          Hard selected
        </p>
        <DifficultyWrapper
          options={['easy', 'medium', 'hard'] as const}
          defaultValue="hard"
        />
      </div>
    </div>
  ),
}

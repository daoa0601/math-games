import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { GameCard } from './GameCard'

const meta: Meta<typeof GameCard> = {
  title: 'Components/GameCard',
  component: GameCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: '320px' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof GameCard>

export const MagicGraph: Story = {
  args: {
    id: 'magicGraph',
    title: 'Magic Graph',
    description: 'Place numbers on nodes so connected sums are equal',
    icon: '✨',
    tags: ['Logic', 'Numbers'],
    to: '/magic-graph',
  },
}

export const SequenceRace: Story = {
  args: {
    id: 'sequenceRace',
    title: 'Sequence Race',
    description: 'Race to the target using arithmetic sequences',
    icon: '🏃',
    tags: ['Sequences', 'Strategy'],
    to: '/sequence-race',
  },
}

export const ShapeArchitect: Story = {
  args: {
    id: 'shapeArchitect',
    title: 'Shape Architect',
    description: 'Build 3D shapes with voxel blocks',
    icon: '🏗️',
    tags: ['Geometry', '3D'],
    to: '/shape-architect',
  },
}

export const WithProgress: Story = {
  args: {
    id: 'magicGraph',
    title: 'Magic Graph',
    description: 'Place numbers on nodes so connected sums are equal',
    icon: '✨',
    tags: ['Logic', 'Numbers'],
    to: '/magic-graph',
    progress: {
      completed: 7,
      total: 10,
    },
  },
}

export const WithNew: Story = {
  args: {
    id: 'shapeArchitect',
    title: 'Shape Architect',
    description: 'Build 3D shapes with voxel blocks',
    icon: '🏗️',
    tags: ['Geometry', '3D'],
    to: '/shape-architect',
    isNew: true,
  },
}

export const Disabled: Story = {
  args: {
    id: 'sequenceRace',
    title: 'Coming Soon',
    description: 'This game is not yet available',
    icon: '🔒',
    tags: ['Locked'],
    to: '/sequence-race',
    disabled: true,
  },
}

export const AllGames: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '900px' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  render: () => (
    <>
      <GameCard
        id="magicGraph"
        title="Magic Graph"
        description="Place numbers on nodes so connected sums are equal"
        icon="✨"
        tags={['Logic', 'Numbers']}
        to="/magic-graph"
        progress={{ completed: 5, total: 10 }}
      />
      <GameCard
        id="sequenceRace"
        title="Sequence Race"
        description="Race to the target using arithmetic sequences"
        icon="🏃"
        tags={['Sequences', 'Strategy']}
        to="/sequence-race"
        progress={{ completed: 3, total: 8 }}
      />
      <GameCard
        id="shapeArchitect"
        title="Shape Architect"
        description="Build 3D shapes with voxel blocks"
        icon="🏗️"
        tags={['Geometry', '3D']}
        to="/shape-architect"
        isNew
      />
    </>
  ),
}

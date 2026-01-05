import type { Meta, StoryObj } from '@storybook/react'
import { GameOverlay } from './GameOverlay'

const meta: Meta<typeof GameOverlay> = {
  title: 'Components/GameOverlay',
  component: GameOverlay,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '400px', height: '500px', background: '#1a1a2e' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['win', 'lose', 'timeUp'],
    },
  },
}

export default meta
type Story = StoryObj<typeof GameOverlay>

export const Win: Story = {
  args: {
    variant: 'win',
    emoji: '🎊',
    title: '🎉 You Win!',
    message: 'Great strategy! You outsmarted the AI.',
    stats: [
      { value: '45s', label: 'Time' },
      { value: 12, label: 'Moves' },
    ],
    children: (
      <>
        <button className="action action--primary">Play Again</button>
        <button className="action action--secondary">New Game</button>
      </>
    ),
  },
}

export const Lose: Story = {
  args: {
    variant: 'lose',
    emoji: '🤖',
    title: '🤖 AI Wins!',
    message: 'Better luck next time!',
    stats: [
      { value: '62s', label: 'Time' },
      { value: 8, label: 'Moves' },
    ],
    hint: (
      <>
        <h4>💡 Math Tip</h4>
        <p>
          <strong>Arithmetic Sequence:</strong> Each term differs by a constant value.
        </p>
        <p>Try to recognize the pattern and work backwards from the target!</p>
      </>
    ),
    children: (
      <>
        <button className="action action--primary">Try Again</button>
        <button className="action action--secondary">New Game</button>
      </>
    ),
  },
}

export const TimeUp: Story = {
  args: {
    variant: 'timeUp',
    emoji: '⏰',
    title: "Time's Up!",
    message: 'Try practice mode for unlimited time.',
    hint: (
      <>
        <h4>💡 Sequence Tip</h4>
        <p>
          <strong>Formula:</strong> <code>a_n = a_1 + (n-1)d</code>
        </p>
      </>
    ),
    children: (
      <>
        <button className="action action--primary">Try Again</button>
        <button className="action action--secondary">New Game</button>
      </>
    ),
  },
}

export const WinWithoutStats: Story = {
  args: {
    variant: 'win',
    emoji: '🏆',
    title: 'Level Complete!',
    message: 'You solved the puzzle perfectly!',
    children: <button className="action action--primary">Continue</button>,
  },
}

export const LoseWithLongHint: Story = {
  args: {
    variant: 'lose',
    emoji: '📚',
    title: 'Learning Moment',
    message: "That was a tricky one! Here's what you can learn:",
    hint: (
      <>
        <h4>💡 Game Theory Insight</h4>
        <p>
          This game is based on <strong>Nim-like mathematics</strong>. The key is to
          identify "winning positions" where you can force a win regardless of what
          your opponent does.
        </p>
        <p>
          A position is winning if there exists at least one move that leaves your
          opponent in a losing position.
        </p>
      </>
    ),
    children: (
      <>
        <button className="action action--primary">Try Again</button>
        <button className="action action--secondary">Different Puzzle</button>
      </>
    ),
  },
}

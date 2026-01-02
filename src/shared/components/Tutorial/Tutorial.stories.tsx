import type { Meta, StoryObj } from '@storybook/react';
import { Tutorial } from './Tutorial';
import { TutorialStep } from './TutorialStep';
import { TutorialTooltip } from './TutorialTooltip';

const meta: Meta<typeof Tutorial> = {
  title: 'Components/Tutorial',
  component: Tutorial,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'fullscreen',
  },
  argTypes: {
    totalSteps: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Total number of tutorial steps',
    },
    autoStart: {
      control: 'boolean',
      description: 'Whether to automatically start the tutorial',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tutorial>;

// Sample game UI to demonstrate tutorial
const SampleGameUI = () => (
  <div style={{ padding: '2rem', minHeight: '100vh' }}>
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 id="game-title" style={{ marginBottom: '2rem' }}>Sample Math Game</h1>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div id="score-display" style={{
          padding: '1rem',
          background: 'var(--color-primary)',
          borderRadius: '8px',
          color: 'white'
        }}>
          Score: 0
        </div>
        <div id="timer-display" style={{
          padding: '1rem',
          background: 'var(--color-secondary)',
          borderRadius: '8px',
          color: 'white'
        }}>
          Time: 00:00
        </div>
      </div>

      <div id="game-board" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <div
            key={num}
            className="game-cell"
            style={{
              padding: '2rem',
              background: 'var(--color-bg-secondary)',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '1.5rem',
              border: '2px solid var(--color-border)'
            }}
          >
            {num}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button id="hint-button" style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--color-accent)',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Hint
        </button>
        <button id="reset-button" style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--color-danger)',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          color: 'white'
        }}>
          Reset
        </button>
      </div>
    </div>
  </div>
);

export const BasicThreeStepTutorial: Story = {
  args: {
    totalSteps: 3,
    autoStart: true,
  },
  render: (args) => (
    <Tutorial {...args}>
      <SampleGameUI />

      <TutorialStep step={1} highlightSelector="#game-title">
        <TutorialTooltip position="bottom">
          Welcome to the Math Game! This tutorial will show you how to play.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={2} highlightSelector="#game-board">
        <TutorialTooltip position="top">
          This is the game board. Click on cells to make your moves.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={3} highlightSelector="#score-display">
        <TutorialTooltip position="right" showPrevious>
          Keep an eye on your score here. Try to get the highest score possible!
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  ),
};

export const FiveStepCompleteTutorial: Story = {
  args: {
    totalSteps: 5,
    autoStart: true,
  },
  render: (args) => (
    <Tutorial {...args}>
      <SampleGameUI />

      <TutorialStep step={1}>
        <TutorialTooltip position="bottom">
          Welcome! Let's learn how to play this game.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={2} highlightSelector="#game-board">
        <TutorialTooltip position="top">
          This is your game board. Each cell contains a number you can interact with.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={3} highlightSelector="#score-display">
        <TutorialTooltip position="right" showPrevious>
          Your score is displayed here. Complete challenges to earn points!
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={4} highlightSelector="#timer-display">
        <TutorialTooltip position="left" showPrevious>
          The timer shows how long you've been playing. Some modes are time-limited!
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={5} highlightSelector="#hint-button">
        <TutorialTooltip position="top" showPrevious>
          Need help? Click the Hint button for assistance. Now you're ready to play!
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  ),
};

export const TutorialWithoutSkipButton: Story = {
  args: {
    totalSteps: 3,
    autoStart: true,
  },
  render: (args) => (
    <Tutorial {...args}>
      <SampleGameUI />

      <TutorialStep step={1} highlightSelector="#game-title">
        <TutorialTooltip position="bottom" showSkip={false}>
          This tutorial cannot be skipped. You must complete all steps.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={2} highlightSelector="#game-board">
        <TutorialTooltip position="top" showSkip={false}>
          Click on the cells to interact with the game board.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={3} highlightSelector="#score-display">
        <TutorialTooltip position="right" showSkip={false} showPrevious>
          Your final score will be displayed here. Good luck!
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  ),
};

export const CenteredTutorial: Story = {
  args: {
    totalSteps: 2,
    autoStart: true,
  },
  render: (args) => (
    <Tutorial {...args}>
      <SampleGameUI />

      <TutorialStep step={1}>
        <TutorialTooltip>
          This tooltip is centered on the screen because no target element is specified.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={2} highlightSelector="#game-board">
        <TutorialTooltip position="bottom" showPrevious>
          Now we're highlighting a specific element with the tooltip positioned relative to it.
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  ),
};

export const TutorialAllPositions: Story = {
  args: {
    totalSteps: 4,
    autoStart: true,
  },
  render: (args) => (
    <Tutorial {...args}>
      <SampleGameUI />

      <TutorialStep step={1} highlightSelector="#game-title">
        <TutorialTooltip position="bottom">
          Tooltip positioned at the BOTTOM of the target element.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={2} highlightSelector="#game-board">
        <TutorialTooltip position="top" showPrevious>
          Tooltip positioned at the TOP of the target element.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={3} highlightSelector="#score-display">
        <TutorialTooltip position="right" showPrevious>
          Tooltip positioned to the RIGHT of the target element.
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={4} highlightSelector="#timer-display">
        <TutorialTooltip position="left" showPrevious>
          Tooltip positioned to the LEFT of the target element.
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  ),
};

export const ManualStartTutorial: Story = {
  args: {
    totalSteps: 3,
    autoStart: false,
  },
  render: (args) => (
    <Tutorial {...args}>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Tutorial with Manual Start</h2>
        <p>Set autoStart to false to prevent automatic tutorial start.</p>
        <p>You would typically provide a "Start Tutorial" button in your UI.</p>
        <div id="content" style={{ marginTop: '2rem', padding: '2rem', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
          Sample content here
        </div>
      </div>

      <TutorialStep step={1}>
        <TutorialTooltip>
          Tutorial step 1 - this won't show automatically
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={2} highlightSelector="#content">
        <TutorialTooltip position="top" showPrevious>
          Tutorial step 2
        </TutorialTooltip>
      </TutorialStep>

      <TutorialStep step={3}>
        <TutorialTooltip showPrevious>
          Tutorial step 3 - final step
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  ),
};

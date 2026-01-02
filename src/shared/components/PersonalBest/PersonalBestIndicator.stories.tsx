import type { Meta, StoryObj } from '@storybook/react'
import { PersonalBestIndicator } from './PersonalBestIndicator'

const meta: Meta<typeof PersonalBestIndicator> = {
  title: 'Components/PersonalBestIndicator',
  component: PersonalBestIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Shows personal best comparison on game completion. Displays a celebratory badge when a new PB is achieved, or shows the difference from the best time.',
      },
    },
  },
  argTypes: {
    currentTime: {
      control: { type: 'number', min: 1, max: 300 },
      description: 'Current completion time in seconds',
    },
    previousBest: {
      control: { type: 'number', min: 1, max: 300 },
      description: 'Previous best time (null if first completion)',
    },
    isNewBest: {
      control: 'boolean',
      description: 'Whether this is a new personal best',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof PersonalBestIndicator>

export const NewPersonalBest: Story = {
  args: {
    currentTime: 45,
    previousBest: 60,
    isNewBest: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays when player achieves a new personal best time, showing the improvement.',
      },
    },
  },
}

export const NewPersonalBestFirstTime: Story = {
  args: {
    currentTime: 75,
    previousBest: null,
    isNewBest: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'First time completion - automatically a new personal best but shows no improvement since no previous time exists.',
      },
    },
  },
}

export const SlightImprovement: Story = {
  args: {
    currentTime: 58,
    previousBest: 60,
    isNewBest: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Small improvement of 2 seconds over previous best.',
      },
    },
  },
}

export const MajorImprovement: Story = {
  args: {
    currentTime: 30,
    previousBest: 90,
    isNewBest: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Significant improvement of 60 seconds - new player learning the game.',
      },
    },
  },
}

export const NotPersonalBest: Story = {
  args: {
    currentTime: 75,
    previousBest: 60,
    isNewBest: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Player did not beat their personal best. Shows the difference (+15s slower).',
      },
    },
  },
}

export const SlightlySlower: Story = {
  args: {
    currentTime: 62,
    previousBest: 60,
    isNewBest: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Close but not quite - 2 seconds slower than personal best.',
      },
    },
  },
}

export const TiedPersonalBest: Story = {
  args: {
    currentTime: 60,
    previousBest: 60,
    isNewBest: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Matched their personal best time exactly - shows special "tied" state.',
      },
    },
  },
}

export const FirstCompletion: Story = {
  args: {
    currentTime: 90,
    previousBest: null,
    isNewBest: true,
  },
  parameters: {
    docs: {
      description: {
        story: "First time completing the game - there's no previous best to compare against.",
      },
    },
  },
}

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <div>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          New Personal Best
        </h4>
        <PersonalBestIndicator currentTime={45} previousBest={60} isNewBest={true} />
      </div>

      <div>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          First Completion
        </h4>
        <PersonalBestIndicator currentTime={75} previousBest={null} isNewBest={true} />
      </div>

      <div>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>Tied Best</h4>
        <PersonalBestIndicator currentTime={60} previousBest={60} isNewBest={false} />
      </div>

      <div>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Not Personal Best
        </h4>
        <PersonalBestIndicator currentTime={75} previousBest={60} isNewBest={false} />
      </div>

      <div>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Major Improvement
        </h4>
        <PersonalBestIndicator currentTime={30} previousBest={90} isNewBest={true} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All possible states of the PersonalBestIndicator component.',
      },
    },
  },
}

export const FastTime: Story = {
  args: {
    currentTime: 12,
    previousBest: 15,
    isNewBest: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Very fast completion time - advanced player.',
      },
    },
  },
}

export const SlowTime: Story = {
  args: {
    currentTime: 240,
    previousBest: 180,
    isNewBest: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Slower completion time - player might have stepped away or encountered difficulty.',
      },
    },
  },
}

export const WithCustomClassName: Story = {
  args: {
    currentTime: 45,
    previousBest: 60,
    isNewBest: true,
    className: 'custom-class',
  },
}

export const OnDarkBackground: Story = {
  args: {
    currentTime: 45,
    previousBest: 60,
    isNewBest: true,
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
  parameters: {
    docs: {
      description: {
        story: 'PersonalBestIndicator on a dark background, showing how it adapts to different themes.',
      },
    },
  },
}

export const ComparisonScenario: Story = {
  render: () => (
    <div style={{ maxWidth: '600px', padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>Game Completion Results</h3>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Scenario 1:</strong> Beginner's First Attempt
          </p>
          <PersonalBestIndicator currentTime={120} previousBest={null} isNewBest={true} />
        </div>

        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Scenario 2:</strong> Second Attempt - Good Progress!
          </p>
          <PersonalBestIndicator currentTime={90} previousBest={120} isNewBest={true} />
        </div>

        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Scenario 3:</strong> Third Attempt - Not Quite There
          </p>
          <PersonalBestIndicator currentTime={95} previousBest={90} isNewBest={false} />
        </div>

        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Scenario 4:</strong> Fourth Attempt - Tied!
          </p>
          <PersonalBestIndicator currentTime={90} previousBest={90} isNewBest={false} />
        </div>

        <div>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Scenario 5:</strong> Breakthrough - New Best!
          </p>
          <PersonalBestIndicator currentTime={65} previousBest={90} isNewBest={true} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Story showing a player's journey through multiple attempts, demonstrating how the component responds to different scenarios.",
      },
    },
  },
}

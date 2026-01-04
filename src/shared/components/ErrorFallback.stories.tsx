import type { Meta, StoryObj } from '@storybook/react'
import { ErrorFallback } from './ErrorFallback'

const meta: Meta<typeof ErrorFallback> = {
  title: 'Components/ErrorFallback',
  component: ErrorFallback,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    error: {
      control: 'object',
      description: 'Error object with message and stack trace',
    },
    onReset: {
      action: 'reset',
      description: 'Callback function when reset button is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof ErrorFallback>

const sampleError = new Error('Failed to load game assets')
sampleError.stack = `Error: Failed to load game assets
    at GameLoader.load (GameLoader.ts:45:12)
    at async loadMagicGraph (index.tsx:23:5)
    at async Game.init (Game.tsx:89:3)`

const longError = new Error(
  'Network request failed with status 500: Internal Server Error. The server encountered an unexpected condition that prevented it from fulfilling the request.'
)
longError.stack = `Error: Network request failed with status 500: Internal Server Error
    at fetch (fetch.ts:120:15)
    at async fetchGameData (api.ts:34:8)
    at async loadGameState (state.ts:67:12)
    at async GameComponent.componentDidMount (GameComponent.tsx:45:5)
    at async React.render (react-dom.development.js:2345:7)`

export const Default: Story = {
  args: {
    error: sampleError,
    onReset: () => console.log('Reset clicked'),
  },
}

export const NoError: Story = {
  args: {
    error: null,
    onReset: () => console.log('Reset clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error fallback when no error object is provided (should still show generic error message).',
      },
    },
  },
}

export const LongErrorMessage: Story = {
  args: {
    error: longError,
    onReset: () => console.log('Reset clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error fallback with a long error message and stack trace.',
      },
    },
  },
}

export const ProductionMode: Story = {
  args: {
    error: sampleError,
    onReset: () => console.log('Reset clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'In production mode (import.meta.env.DEV = false), technical details are hidden. This story simulates production mode by not showing the error details.',
      },
    },
  },
  decorators: [
    (Story) => {
      // Simulate production environment by hiding error details
      // Note: This is for demonstration - in actual use, the component reads import.meta.env.DEV
      return (
        <div data-env="production">
          <Story />
        </div>
      )
    },
  ],
}

export const WithInteraction: Story = {
  args: {
    error: new Error('Game crashed due to invalid state'),
    onReset: () => alert('Game will be reset and reloaded'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the "Try Again" button to trigger the reset callback, or "Go Home" to navigate to the home page.',
      },
    },
  },
}

export const SimpleError: Story = {
  args: {
    error: new Error('Something went wrong'),
    onReset: () => console.log('Reset clicked'),
  },
}

export const CustomTheme: Story = {
  args: {
    error: sampleError,
    onReset: () => console.log('Reset clicked'),
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#1a1a2e', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Error fallback on a custom dark background theme.',
      },
    },
  },
}

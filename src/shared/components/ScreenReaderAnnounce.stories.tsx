import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  ScreenReaderAnnounce,
  ScreenReaderAnnounceProvider,
  useAnnounce,
  type AnnouncePriority,
} from './ScreenReaderAnnounce'

const meta: Meta<typeof ScreenReaderAnnounce> = {
  title: 'Components/ScreenReaderAnnounce',
  component: ScreenReaderAnnounce,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Accessible announcement system for screen readers using ARIA live regions. Provides both standalone component and provider/hook pattern for complex use cases.',
      },
    },
  },
  argTypes: {
    message: {
      control: 'text',
      description: 'Message to announce to screen readers',
    },
    priority: {
      control: 'select',
      options: ['polite', 'assertive'],
      description: 'Priority level: "polite" waits for current speech, "assertive" interrupts immediately',
    },
  },
}

export default meta
type Story = StoryObj<typeof ScreenReaderAnnounce>

export const PoliteAnnouncement: Story = {
  args: {
    message: 'Your score has been saved',
    priority: 'polite',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Polite announcements wait for the screen reader to finish current speech. Use for non-urgent updates like score changes.',
      },
    },
  },
}

export const AssertiveAnnouncement: Story = {
  args: {
    message: 'Warning: Only 10 seconds remaining!',
    priority: 'assertive',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Assertive announcements interrupt current speech immediately. Use sparingly for critical time-sensitive information.',
      },
    },
  },
}

export const EmptyMessage: Story = {
  args: {
    message: '',
    priority: 'polite',
  },
  parameters: {
    docs: {
      description: {
        story: 'When message is empty, nothing is announced.',
      },
    },
  },
}

// Interactive demo component using the hook pattern
function InteractiveDemo() {
  const { announce } = useAnnounce()
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<AnnouncePriority>('polite')

  const handleAnnounce = () => {
    if (message) {
      announce(message, priority)
    }
  }

  const handleIncrement = () => {
    const newCount = count + 1
    setCount(newCount)
    announce(`Count is now ${newCount}`, 'polite')
  }

  const handleWarning = () => {
    announce('Warning: This is an urgent message!', 'assertive')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Custom Announcement</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter announcement message"
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem',
            }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as AnnouncePriority)}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem',
            }}
          >
            <option value="polite">Polite</option>
            <option value="assertive">Assertive</option>
          </select>
          <button
            onClick={handleAnnounce}
            style={{
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Announce Message
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Counter Example</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Count: {count}</p>
        <button
          onClick={handleIncrement}
          style={{
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Increment (announces change)
        </button>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>Assertive Warning</h3>
        <button
          onClick={handleWarning}
          style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Trigger Warning
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Note: Use a screen reader to hear the announcements. They are invisible but accessible.
        </p>
      </div>
    </div>
  )
}

export const WithProvider: Story = {
  render: () => (
    <ScreenReaderAnnounceProvider>
      <InteractiveDemo />
    </ScreenReaderAnnounceProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing the provider/hook pattern. Type a message and click announce, or use the pre-configured examples. Use a screen reader to hear the announcements.',
      },
    },
  },
}

// Game timer example
function GameTimerExample() {
  const [seconds, setSeconds] = useState(60)
  const [isRunning, setIsRunning] = useState(false)

  const handleStart = () => {
    setIsRunning(true)
    setSeconds(60)
  }

  const handleStop = () => {
    setIsRunning(false)
  }

  // Simulate timer countdown
  useState(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setIsRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  })

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h3 style={{ marginBottom: '1rem' }}>Game Timer</h3>
      <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>{seconds}s</div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={handleStart}
          disabled={isRunning}
          style={{
            padding: '0.5rem 1rem',
            background: isRunning ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
          }}
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!isRunning}
          style={{
            padding: '0.5rem 1rem',
            background: !isRunning ? '#9ca3af' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isRunning ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
          }}
        >
          Stop
        </button>
      </div>

      {/* Announce critical time milestones */}
      {seconds === 30 && <ScreenReaderAnnounce message="30 seconds remaining" priority="polite" />}
      {seconds === 10 && <ScreenReaderAnnounce message="10 seconds remaining" priority="assertive" />}
      {seconds === 5 && <ScreenReaderAnnounce message="5 seconds remaining" priority="assertive" />}
      {seconds === 0 && <ScreenReaderAnnounce message="Time is up!" priority="assertive" />}
    </div>
  )
}

export const GameTimerWithAnnouncements: Story = {
  render: () => <GameTimerExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Example of using ScreenReaderAnnounce standalone component in a game timer. Announces at 30s (polite), 10s, 5s, and 0s (assertive).',
      },
    },
  },
}

export const VisualDemonstration: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h3 style={{ marginBottom: '1rem' }}>How Screen Reader Announcements Work</h3>

      <div
        style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: '#eff6ff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
        }}
      >
        <h4 style={{ marginTop: 0, color: '#1e40af' }}>Polite Announcements</h4>
        <p style={{ margin: '0.5rem 0' }}>
          Uses <code>aria-live="polite"</code> and <code>role="status"</code>
        </p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          Waits for screen reader to finish current speech. Good for non-urgent updates like scores, progress, or
          status changes.
        </p>
      </div>

      <div
        style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
        }}
      >
        <h4 style={{ marginTop: 0, color: '#dc2626' }}>Assertive Announcements</h4>
        <p style={{ margin: '0.5rem 0' }}>
          Uses <code>aria-live="assertive"</code> and <code>role="alert"</code>
        </p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          Interrupts current speech immediately. Use sparingly for critical, time-sensitive information like warnings
          or urgent notifications.
        </p>
      </div>

      <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0 }}>Implementation Details</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#374151' }}>
          <li>Announcements are visually hidden but accessible to screen readers</li>
          <li>Uses CSS clip technique for proper screen reader support</li>
          <li>Messages clear automatically after 3 seconds</li>
          <li>Provider pattern allows announcements from anywhere in component tree</li>
          <li>Standalone component available for simple use cases</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual guide explaining how screen reader announcements work and when to use each priority level.',
      },
    },
  },
}

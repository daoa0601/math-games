import type { Meta, StoryObj } from '@storybook/react'
import { Timer } from './Timer'

const meta: Meta<typeof Timer> = {
  title: 'Components/Timer',
  component: Timer,
  tags: ['autodocs'],
  args: {
    onModeChange: () => {},
    onPause: () => {},
    onResume: () => {},
  },
}

export default meta
type Story = StoryObj<typeof Timer>

export const PracticeMode: Story = {
  args: {
    timeLeft: 45,
    formattedTime: '00:45',
    timerClass: '',
    isPracticeMode: true,
    isPaused: false,
  },
}

export const TimedMode: Story = {
  args: {
    timeLeft: 120,
    formattedTime: '02:00',
    timerClass: '',
    isPracticeMode: false,
    isPaused: false,
  },
}

export const TimedModeWarning: Story = {
  args: {
    timeLeft: 45,
    formattedTime: '00:45',
    timerClass: 'timer--warning',
    isPracticeMode: false,
    isPaused: false,
  },
}

export const TimedModeCritical: Story = {
  args: {
    timeLeft: 15,
    formattedTime: '00:15',
    timerClass: 'timer--critical',
    isPracticeMode: false,
    isPaused: false,
  },
}

export const Paused: Story = {
  args: {
    timeLeft: 90,
    formattedTime: '01:30',
    timerClass: '',
    isPracticeMode: false,
    isPaused: true,
  },
}

export const Disabled: Story = {
  args: {
    timeLeft: 0,
    formattedTime: '00:00',
    timerClass: '',
    isPracticeMode: false,
    isPaused: false,
    disabled: true,
  },
}

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Practice Mode</h4>
        <Timer
          timeLeft={125}
          formattedTime="02:05"
          timerClass=""
          isPracticeMode={true}
          isPaused={false}
          onModeChange={() => {}}
          onPause={() => {}}
          onResume={() => {}}
        />
      </div>
      <div>
        <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Timed - Normal</h4>
        <Timer
          timeLeft={90}
          formattedTime="01:30"
          timerClass=""
          isPracticeMode={false}
          isPaused={false}
          onModeChange={() => {}}
          onPause={() => {}}
          onResume={() => {}}
        />
      </div>
      <div>
        <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Timed - Warning</h4>
        <Timer
          timeLeft={45}
          formattedTime="00:45"
          timerClass="timer--warning"
          isPracticeMode={false}
          isPaused={false}
          onModeChange={() => {}}
          onPause={() => {}}
          onResume={() => {}}
        />
      </div>
      <div>
        <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Timed - Critical</h4>
        <Timer
          timeLeft={10}
          formattedTime="00:10"
          timerClass="timer--critical"
          isPracticeMode={false}
          isPaused={false}
          onModeChange={() => {}}
          onPause={() => {}}
          onResume={() => {}}
        />
      </div>
    </div>
  ),
}

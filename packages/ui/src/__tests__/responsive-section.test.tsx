import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import { ResponsiveSection } from '../responsive-section'
import { renderWithLocale } from './test-utils'

describe('ResponsiveSection', () => {
  test('displays the title as a heading', () => {
    renderWithLocale(
      <ResponsiveSection title="Score History">
        <p>Content here</p>
      </ResponsiveSection>,
    )

    expect(
      screen.getByRole('heading', { name: 'Score History' }),
    ).toBeInTheDocument()
  })

  test('displays the description text when provided', () => {
    renderWithLocale(
      <ResponsiveSection
        title="Score History"
        description="Your recent game scores"
      >
        <p>Content here</p>
      </ResponsiveSection>,
    )

    expect(screen.getByText('Your recent game scores')).toBeInTheDocument()
  })

  test('renders children content', () => {
    renderWithLocale(
      <ResponsiveSection title="Score History">
        <p>Score: 42</p>
      </ResponsiveSection>,
    )

    expect(screen.getByText('Score: 42')).toBeInTheDocument()
  })

  test('renders action slot content when provided', () => {
    renderWithLocale(
      <ResponsiveSection
        title="Score History"
        actions={<button>Reset Scores</button>}
      >
        <p>Content</p>
      </ResponsiveSection>,
    )

    expect(
      screen.getByRole('button', { name: 'Reset Scores' }),
    ).toBeInTheDocument()
  })

  test('toggle button has correct expand aria-label when collapsed', () => {
    renderWithLocale(
      <ResponsiveSection title="Score History">
        <p>Content</p>
      </ResponsiveSection>,
    )

    expect(
      screen.getByRole('button', { name: 'Expand Score History' }),
    ).toBeInTheDocument()
  })

  test('clicking the toggle changes aria-label to collapse', async () => {
    const user = userEvent.setup()
    renderWithLocale(
      <ResponsiveSection title="Score History">
        <p>Content</p>
      </ResponsiveSection>,
    )

    await user.click(
      screen.getByRole('button', { name: 'Expand Score History' }),
    )

    expect(
      screen.getByRole('button', { name: 'Collapse Score History' }),
    ).toBeInTheDocument()
  })

  test('applies custom className to the root element', () => {
    const { container } = renderWithLocale(
      <ResponsiveSection title="Test" className="custom-class">
        <p>Content</p>
      </ResponsiveSection>,
    )

    const root = container.querySelector('[data-slot="collapsible"]')
    expect(root).toHaveClass('custom-class')
  })
})

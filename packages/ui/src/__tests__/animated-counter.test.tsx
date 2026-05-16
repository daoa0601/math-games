import { render, screen, act } from '@testing-library/react'
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'

import { AnimatedCounter } from '../animated-counter'

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('displays the initial value of zero', () => {
    render(<AnimatedCounter value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  test('displays a non-zero value after animation completes', () => {
    render(<AnimatedCounter value={100} duration={100} />)

    // Advance past the animation duration so rAF fires
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByText('100')).toBeInTheDocument()
  })

  test('applies the provided className to the span', () => {
    const { container } = render(
      <AnimatedCounter value={42} className="score-display" />,
    )
    const span = container.querySelector('span')
    expect(span).toHaveClass('score-display')
  })

  test('updates to a new target value when props change', () => {
    const { rerender } = render(<AnimatedCounter value={50} duration={100} />)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.getByText('50')).toBeInTheDocument()

    rerender(<AnimatedCounter value={75} duration={100} />)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  test('counts down when value decreases', () => {
    const { rerender } = render(<AnimatedCounter value={100} duration={100} />)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.getByText('100')).toBeInTheDocument()

    rerender(<AnimatedCounter value={0} duration={100} />)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

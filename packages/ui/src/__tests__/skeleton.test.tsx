import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { Skeleton } from '../ui/skeleton'

describe('Skeleton', () => {
  test('renders with the base animate-pulse and bg-muted classes', () => {
    render(<Skeleton data-testid="skeleton" />)

    const el = screen.getByTestId('skeleton')
    expect(el).toHaveClass('animate-pulse')
    expect(el).toHaveClass('rounded-md')
    expect(el).toHaveClass('bg-muted')
  })

  test('merges custom className with default classes', () => {
    render(<Skeleton data-testid="skeleton" className="h-8 w-32" />)

    const el = screen.getByTestId('skeleton')
    expect(el).toHaveClass('animate-pulse')
    expect(el).toHaveClass('h-8')
    expect(el).toHaveClass('w-32')
  })

  test('passes through additional HTML attributes', () => {
    render(
      <Skeleton data-testid="skeleton" aria-label="Loading content" />,
    )

    expect(screen.getByTestId('skeleton')).toHaveAttribute(
      'aria-label',
      'Loading content',
    )
  })

  test('renders as a div element', () => {
    render(<Skeleton data-testid="skeleton" />)

    const el = screen.getByTestId('skeleton')
    expect(el.tagName).toBe('DIV')
  })
})

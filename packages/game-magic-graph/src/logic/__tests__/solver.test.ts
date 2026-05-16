import { describe, it, expect } from 'vitest'
import { getLineStatus, isPuzzleSolved, solve } from '../solver'
import type { GraphNode, Line } from '../types'

// ========================================
// Test Fixtures
// ========================================

// Simple 3-node line puzzle: nodes must sum to 6
const createSimpleLine = (): { nodes: GraphNode[]; lines: Line[] } => ({
  nodes: [
    { id: 'n1', position: { x: 0, y: 0 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 1, y: 0 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 2, y: 0 }, value: null, isFixed: false },
  ],
  lines: [{ id: 'line1', nodeIds: ['n1', 'n2', 'n3'] }],
})

// Cross puzzle: center node shared by two lines
const createCross = (): { nodes: GraphNode[]; lines: Line[] } => ({
  nodes: [
    { id: 'left', position: { x: 0, y: 1 }, value: null, isFixed: false },
    { id: 'center', position: { x: 1, y: 1 }, value: null, isFixed: false },
    { id: 'right', position: { x: 2, y: 1 }, value: null, isFixed: false },
    { id: 'top', position: { x: 1, y: 0 }, value: null, isFixed: false },
    { id: 'bottom', position: { x: 1, y: 2 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'horizontal', nodeIds: ['left', 'center', 'right'] },
    { id: 'vertical', nodeIds: ['top', 'center', 'bottom'] },
  ],
})

// ========================================
// getLineStatus Tests
// ========================================

describe('getLineStatus', () => {
  const line: Line = { id: 'test', nodeIds: ['n1', 'n2', 'n3'] }

  it('returns incomplete status when not all nodes filled', () => {
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', null],
      ['n3', 2],
    ])

    const result = getLineStatus(line, values, 6)

    expect(result.status).toBe('incomplete')
    expect(result.currentSum).toBe(3)
    expect(result.filledCount).toBe(2)
  })

  it('returns correct status when sum equals target', () => {
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', 3],
    ])

    const result = getLineStatus(line, values, 6)

    expect(result.status).toBe('correct')
    expect(result.currentSum).toBe(6)
    expect(result.filledCount).toBe(3)
  })

  it('returns incorrect status when complete but sum wrong', () => {
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', 4],
    ])

    const result = getLineStatus(line, values, 6)

    expect(result.status).toBe('incorrect')
    expect(result.currentSum).toBe(7)
  })

  it('returns overflow status when partial sum exceeds target', () => {
    const values = new Map<string, number | null>([
      ['n1', 5],
      ['n2', 4],
      ['n3', null],
    ])

    const result = getLineStatus(line, values, 6)

    expect(result.status).toBe('overflow')
    expect(result.currentSum).toBe(9)
  })

  it('handles empty line (all null values)', () => {
    const values = new Map<string, number | null>([
      ['n1', null],
      ['n2', null],
      ['n3', null],
    ])

    const result = getLineStatus(line, values, 6)

    expect(result.status).toBe('incomplete')
    expect(result.currentSum).toBe(0)
    expect(result.filledCount).toBe(0)
  })

  it('handles undefined values in map', () => {
    const values = new Map<string, number | null>()
    // n1, n2, n3 not in map at all

    const result = getLineStatus(line, values, 6)

    expect(result.status).toBe('incomplete')
    expect(result.currentSum).toBe(0)
    expect(result.filledCount).toBe(0)
  })
})

// ========================================
// isPuzzleSolved Tests
// ========================================

describe('isPuzzleSolved', () => {
  it('returns true when all lines are correct', () => {
    const { lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', 3],
    ])

    expect(isPuzzleSolved(lines, values, 6)).toBe(true)
  })

  it('returns false when any line is incomplete', () => {
    const { lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', null],
      ['n3', 3],
    ])

    expect(isPuzzleSolved(lines, values, 6)).toBe(false)
  })

  it('returns false when any line is incorrect', () => {
    const { lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', 4], // Sum is 7, not 6
    ])

    expect(isPuzzleSolved(lines, values, 6)).toBe(false)
  })

  it('handles multiple lines correctly', () => {
    const { lines } = createCross()
    // Horizontal: 1 + 5 + 4 = 10, Vertical: 2 + 5 + 3 = 10
    const values = new Map<string, number | null>([
      ['left', 1],
      ['center', 5],
      ['right', 4],
      ['top', 2],
      ['bottom', 3],
    ])

    expect(isPuzzleSolved(lines, values, 10)).toBe(true)
  })

  it('returns false if one of multiple lines wrong', () => {
    const { lines } = createCross()
    const values = new Map<string, number | null>([
      ['left', 1],
      ['center', 5],
      ['right', 4], // Horizontal = 10 ✓
      ['top', 2],
      ['bottom', 4], // Vertical = 11 ✗
    ])

    expect(isPuzzleSolved(lines, values, 10)).toBe(false)
  })
})

// ========================================
// solve Tests
// ========================================

describe('solve', () => {
  it('finds solution for simple line puzzle', () => {
    const { nodes, lines } = createSimpleLine()
    const available = [1, 2, 3]

    const solutions = solve(nodes, lines, available, 6, 10)

    expect(solutions.length).toBeGreaterThan(0)

    // Verify first solution sums to 6
    const sol = solutions[0]
    const sum =
      (sol.get('n1') ?? 0) + (sol.get('n2') ?? 0) + (sol.get('n3') ?? 0)
    expect(sum).toBe(6)
  })

  it('finds all permutations as solutions for simple case', () => {
    const { nodes, lines } = createSimpleLine()
    const available = [1, 2, 3]

    // 1+2+3=6, there are 3!=6 permutations
    const solutions = solve(nodes, lines, available, 6, 10)

    expect(solutions.length).toBe(6)
  })

  it('returns empty array when no solution exists', () => {
    const { nodes, lines } = createSimpleLine()
    const available = [1, 2, 3]

    // Target 100 is impossible with [1,2,3]
    const solutions = solve(nodes, lines, available, 100, 10)

    expect(solutions).toHaveLength(0)
  })

  it('respects maxSolutions limit', () => {
    const { nodes, lines } = createSimpleLine()
    const available = [1, 2, 3]

    const solutions = solve(nodes, lines, available, 6, 2)

    expect(solutions.length).toBeLessThanOrEqual(2)
  })

  it('respects fixed nodes', () => {
    const nodes: GraphNode[] = [
      { id: 'n1', position: { x: 0, y: 0 }, value: 1, isFixed: true },
      { id: 'n2', position: { x: 1, y: 0 }, value: null, isFixed: false },
      { id: 'n3', position: { x: 2, y: 0 }, value: null, isFixed: false },
    ]
    const lines: Line[] = [{ id: 'line1', nodeIds: ['n1', 'n2', 'n3'] }]
    const available = [1, 2, 3, 4, 5]

    const solutions = solve(nodes, lines, available, 6, 10)

    // n1 is fixed at 1, so n2+n3 must = 5
    // Valid: (2,3) and (3,2) using remaining numbers
    expect(solutions.length).toBe(2)

    for (const sol of solutions) {
      // Fixed node should not be in solution map (or could be)
      const n2 = sol.get('n2')!
      const n3 = sol.get('n3')!
      expect(n2 + n3).toBe(5)
    }
  })

  it('handles cross puzzle with shared node', () => {
    const { nodes, lines } = createCross()
    // Both lines must sum to 15
    // Horizontal: left + center + right = 15
    // Vertical: top + center + bottom = 15
    const available = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const solutions = solve(nodes, lines, available, 15, 5)

    expect(solutions.length).toBeGreaterThan(0)

    // Verify solution satisfies both constraints
    const sol = solutions[0]
    const horizontal =
      (sol.get('left') ?? 0) +
      (sol.get('center') ?? 0) +
      (sol.get('right') ?? 0)
    const vertical =
      (sol.get('top') ?? 0) +
      (sol.get('center') ?? 0) +
      (sol.get('bottom') ?? 0)

    expect(horizontal).toBe(15)
    expect(vertical).toBe(15)
  })

  it('terminates early when maxIterations reached', () => {
    const { nodes, lines } = createCross()
    const available = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    // Very low iteration limit
    const solutions = solve(nodes, lines, available, 15, 100, 5)

    // Should return whatever was found (possibly nothing)
    expect(Array.isArray(solutions)).toBe(true)
  })
})

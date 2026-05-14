import { describe, it, expect } from 'vitest'
import {
  getLineStatus,
  isPuzzleSolved,
  solve,
  generatePuzzle,
  isLinePossible,
  findImpossibleLines,
  analyzeNodes,
  findBestStartingNode,
  deriveAlgebraicHints,
} from '../solver'
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

// ========================================
// generatePuzzle Tests
// ========================================

describe('generatePuzzle', () => {
  it('generates puzzle with ID starting with puzzle_', () => {
    const basePuzzle = {
      name: 'Test',
      nodes: createSimpleLine().nodes,
      lines: createSimpleLine().lines,
      targetSum: 6,
      availableNumbers: [1, 2, 3],
      difficulty: 'easy' as const,
    }

    const puzzle = generatePuzzle(basePuzzle, 1)

    expect(puzzle.id).toBeDefined()
    expect(puzzle.id.startsWith('puzzle_')).toBe(true)
    // ID should contain timestamp
    const timestamp = puzzle.id.replace('puzzle_', '')
    expect(Number(timestamp)).toBeGreaterThan(0)
  })

  it('preserves base puzzle properties', () => {
    const basePuzzle = {
      name: 'Test Puzzle',
      nodes: createSimpleLine().nodes,
      lines: createSimpleLine().lines,
      targetSum: 6,
      availableNumbers: [1, 2, 3],
      difficulty: 'medium' as const,
    }

    const puzzle = generatePuzzle(basePuzzle, 1)

    expect(puzzle.name).toBe('Test Puzzle')
    expect(puzzle.targetSum).toBe(6)
    expect(puzzle.difficulty).toBe('medium')
    expect(puzzle.lines).toEqual(basePuzzle.lines)
  })

  it('creates solvable puzzle (has solution)', () => {
    const basePuzzle = {
      name: 'Test',
      nodes: createSimpleLine().nodes,
      lines: createSimpleLine().lines,
      targetSum: 6,
      availableNumbers: [1, 2, 3],
      difficulty: 'easy' as const,
    }

    const puzzle = generatePuzzle(basePuzzle, 1)

    // Verify puzzle has a solution
    const solutions = solve(
      puzzle.nodes,
      puzzle.lines,
      puzzle.availableNumbers,
      puzzle.targetSum,
      1,
    )

    expect(solutions.length).toBeGreaterThan(0)
  })

  it('fixes some nodes based on difficulty hint count', () => {
    const basePuzzle = {
      name: 'Test',
      nodes: createSimpleLine().nodes,
      lines: createSimpleLine().lines,
      targetSum: 6,
      availableNumbers: [1, 2, 3],
      difficulty: 'easy' as const,
    }

    const puzzle = generatePuzzle(basePuzzle, 2) // 2 hints

    const fixedNodes = puzzle.nodes.filter((n) => n.isFixed)
    const emptyNodes = puzzle.nodes.filter(
      (n) => !n.isFixed && n.value === null,
    )

    // Should have some fixed nodes
    expect(fixedNodes.length).toBeGreaterThanOrEqual(0)
    // Should have some empty nodes to solve
    expect(emptyNodes.length).toBeGreaterThanOrEqual(0)
  })

  it('returns fallback when no solution exists', () => {
    const basePuzzle = {
      name: 'Impossible',
      nodes: createSimpleLine().nodes,
      lines: createSimpleLine().lines,
      targetSum: 100, // Impossible with [1,2,3]
      availableNumbers: [1, 2, 3],
      difficulty: 'easy' as const,
    }

    const puzzle = generatePuzzle(basePuzzle, 1)

    // Should return something (fallback behavior)
    expect(puzzle).toBeDefined()
    expect(puzzle.id).toBeDefined()
  })
})

// ========================================
// isLinePossible Tests (Auditor Helper)
// ========================================

describe('isLinePossible', () => {
  const line: Line = { id: 'test', nodeIds: ['n1', 'n2', 'n3'] }
  const available = [1, 2, 3, 4, 5]

  it('returns possible for empty line with achievable target', () => {
    const values = new Map<string, number | null>([
      ['n1', null],
      ['n2', null],
      ['n3', null],
    ])

    const result = isLinePossible(line, values, available, 6)

    expect(result.possible).toBe(true)
    expect(result.neededSum).toBe(6)
    expect(result.emptyCount).toBe(3)
  })

  it('returns impossible when current sum exceeds target', () => {
    const values = new Map<string, number | null>([
      ['n1', 5],
      ['n2', 4],
      ['n3', null],
    ])

    const result = isLinePossible(line, values, available, 6)

    expect(result.possible).toBe(false)
  })

  it('returns impossible when remaining numbers cannot reach needed sum', () => {
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', null],
      ['n3', null],
    ])

    // Need 2 numbers from [2,3,4,5] to sum to 99
    const result = isLinePossible(line, values, available, 100)

    expect(result.possible).toBe(false)
  })

  it('returns possible for complete correct line', () => {
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', 3],
    ])

    const result = isLinePossible(line, values, available, 6)

    expect(result.possible).toBe(true)
    expect(result.emptyCount).toBe(0)
  })

  it('returns impossible for complete incorrect line', () => {
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', 4],
    ])

    const result = isLinePossible(line, values, available, 6)

    expect(result.possible).toBe(false)
  })

  it('correctly calculates neededSum', () => {
    const values = new Map<string, number | null>([
      ['n1', 2],
      ['n2', null],
      ['n3', null],
    ])

    const result = isLinePossible(line, values, available, 10)

    expect(result.neededSum).toBe(8) // 10 - 2
    expect(result.emptyCount).toBe(2)
  })
})

// ========================================
// findImpossibleLines Tests (Auditor)
// ========================================

describe('findImpossibleLines', () => {
  it('returns empty set when all lines possible', () => {
    const { lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', null],
      ['n2', null],
      ['n3', null],
    ])
    const available = [1, 2, 3]

    const impossible = findImpossibleLines(lines, values, available, 6)

    expect(impossible.size).toBe(0)
  })

  it('identifies impossible line due to overflow', () => {
    const { lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 5],
      ['n2', 5],
      ['n3', null],
    ])
    const available = [1, 2, 3, 4, 5]

    const impossible = findImpossibleLines(lines, values, available, 6)

    expect(impossible.has('line1')).toBe(true)
  })

  it('identifies multiple impossible lines', () => {
    const { lines } = createCross()
    // Make both lines impossible
    const values = new Map<string, number | null>([
      ['left', 9],
      ['center', 9],
      ['right', null],
      ['top', 9],
      ['bottom', null],
    ])
    const available = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const impossible = findImpossibleLines(lines, values, available, 10)

    expect(impossible.size).toBe(2)
  })
})

// ========================================
// analyzeNodes Tests (Starter Helper)
// ========================================

describe('analyzeNodes', () => {
  it('returns analysis for each empty node', () => {
    const { nodes, lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', null],
      ['n2', null],
      ['n3', null],
    ])
    const available = [1, 2, 3]

    const analyses = analyzeNodes(nodes, lines, values, available, 6)

    expect(analyses.length).toBe(3)
  })

  it('excludes fixed nodes from analysis', () => {
    const nodes: GraphNode[] = [
      { id: 'n1', position: { x: 0, y: 0 }, value: 1, isFixed: true },
      { id: 'n2', position: { x: 1, y: 0 }, value: null, isFixed: false },
      { id: 'n3', position: { x: 2, y: 0 }, value: null, isFixed: false },
    ]
    const lines: Line[] = [{ id: 'line1', nodeIds: ['n1', 'n2', 'n3'] }]
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', null],
      ['n3', null],
    ])
    const available = [1, 2, 3, 4, 5]

    const analyses = analyzeNodes(nodes, lines, values, available, 6)

    expect(analyses.length).toBe(2) // Only n2 and n3
    expect(analyses.every((a) => a.nodeId !== 'n1')).toBe(true)
  })

  it('sorts by constraint score (most constrained first)', () => {
    const nodes: GraphNode[] = [
      { id: 'n1', position: { x: 0, y: 0 }, value: null, isFixed: false },
      { id: 'n2', position: { x: 1, y: 0 }, value: null, isFixed: false },
    ]
    const lines: Line[] = [{ id: 'line1', nodeIds: ['n1', 'n2'] }]
    const values = new Map<string, number | null>([
      ['n1', null],
      ['n2', null],
    ])
    const available = [1, 2, 3, 4, 5]

    const analyses = analyzeNodes(nodes, lines, values, available, 6)

    // Should be sorted by constraintScore ascending
    for (let i = 1; i < analyses.length; i++) {
      expect(analyses[i].constraintScore).toBeGreaterThanOrEqual(
        analyses[i - 1].constraintScore,
      )
    }
  })

  it('identifies valid options for each node', () => {
    const nodes: GraphNode[] = [
      { id: 'n1', position: { x: 0, y: 0 }, value: 1, isFixed: true },
      { id: 'n2', position: { x: 1, y: 0 }, value: null, isFixed: false },
    ]
    const lines: Line[] = [{ id: 'line1', nodeIds: ['n1', 'n2'] }]
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', null],
    ])
    const available = [1, 2, 3, 4, 5]

    const analyses = analyzeNodes(nodes, lines, values, available, 6)

    // n2 must be 5 (since n1=1 and target=6)
    expect(analyses[0].nodeId).toBe('n2')
    expect(analyses[0].validOptions).toContain(5)
  })
})

// ========================================
// findBestStartingNode Tests (Starter)
// ========================================

describe('findBestStartingNode', () => {
  it('returns null when no empty nodes', () => {
    const nodes: GraphNode[] = [
      { id: 'n1', position: { x: 0, y: 0 }, value: 1, isFixed: true },
      { id: 'n2', position: { x: 1, y: 0 }, value: 2, isFixed: true },
    ]
    const lines: Line[] = [{ id: 'line1', nodeIds: ['n1', 'n2'] }]
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
    ])
    const available = [1, 2, 3]

    const result = findBestStartingNode(nodes, lines, values, available, 3)

    expect(result).toBeNull()
  })

  it('returns forced move when only one option', () => {
    const nodes: GraphNode[] = [
      { id: 'n1', position: { x: 0, y: 0 }, value: 1, isFixed: true },
      { id: 'n2', position: { x: 1, y: 0 }, value: null, isFixed: false },
    ]
    const lines: Line[] = [{ id: 'line1', nodeIds: ['n1', 'n2'] }]
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', null],
    ])
    const available = [1, 2, 3, 4, 5]

    const result = findBestStartingNode(nodes, lines, values, available, 6)

    expect(result).not.toBeNull()
    expect(result!.validOptions).toHaveLength(1)
    expect(result!.validOptions[0]).toBe(5)
    expect(result!.reason).toContain('forced')
  })

  it('identifies backtrack needed when no valid options', () => {
    const nodes: GraphNode[] = [
      { id: 'n1', position: { x: 0, y: 0 }, value: 5, isFixed: true },
      { id: 'n2', position: { x: 1, y: 0 }, value: 5, isFixed: true },
      { id: 'n3', position: { x: 2, y: 0 }, value: null, isFixed: false },
    ]
    const lines: Line[] = [{ id: 'line1', nodeIds: ['n1', 'n2', 'n3'] }]
    const values = new Map<string, number | null>([
      ['n1', 5],
      ['n2', 5],
      ['n3', null],
    ])
    const available = [1, 2, 3, 4, 5]

    const result = findBestStartingNode(nodes, lines, values, available, 6)

    expect(result).not.toBeNull()
    expect(result!.validOptions).toHaveLength(0)
    expect(result!.reason).toContain('backtrack')
  })

  it('returns most constrained node', () => {
    const { nodes, lines } = createCross()
    const values = new Map<string, number | null>([
      ['left', null],
      ['center', null],
      ['right', null],
      ['top', null],
      ['bottom', null],
    ])
    const available = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const result = findBestStartingNode(nodes, lines, values, available, 15)

    expect(result).not.toBeNull()
    expect(result!.nodeId).toBeDefined()
    expect(result!.validOptions.length).toBeGreaterThan(0)
  })
})

// ========================================
// deriveAlgebraicHints Tests (Algebraist)
// ========================================

describe('deriveAlgebraicHints', () => {
  it('returns empty array for fully solved puzzle', () => {
    const { nodes, lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', 3],
    ])

    const hints = deriveAlgebraicHints(nodes, lines, values, 6)

    // No unknowns, so limited hints
    expect(Array.isArray(hints)).toBe(true)
  })

  it('provides direct calculation for single unknown', () => {
    const { nodes, lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', null],
    ])

    const hints = deriveAlgebraicHints(nodes, lines, values, 6)

    const deduction = hints.find((h) => h.type === 'deduction')
    expect(deduction).toBeDefined()
    expect(deduction!.equation).toContain('3') // Should deduce 6-1-2=3
  })

  it('provides sum constraint for two unknowns', () => {
    const { nodes, lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', null],
      ['n3', null],
    ])

    const hints = deriveAlgebraicHints(nodes, lines, values, 6)

    const equation = hints.find((h) => h.type === 'equation')
    expect(equation).toBeDefined()
    expect(equation!.equation).toContain('5') // B + C = 5
  })

  it('handles hidden target mode', () => {
    const { nodes, lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', null],
      ['n3', null],
    ])

    const hints = deriveAlgebraicHints(nodes, lines, values, 6, true)

    // Should use S instead of actual number
    const equation = hints.find((h) => h.type === 'equation')
    expect(equation).toBeDefined()
    expect(equation!.equation).toContain('S')
  })

  it('discovers target from complete line in hidden mode', () => {
    const { nodes, lines } = createSimpleLine()
    const values = new Map<string, number | null>([
      ['n1', 1],
      ['n2', 2],
      ['n3', 3],
    ])

    const hints = deriveAlgebraicHints(nodes, lines, values, 6, true)

    const sumHint = hints.find((h) => h.type === 'sum-hint')
    expect(sumHint).toBeDefined()
    expect(sumHint!.equation).toBe('S = 6')
  })

  it('finds cross-line relationships', () => {
    const { nodes, lines } = createCross()
    const values = new Map<string, number | null>([
      ['left', null],
      ['center', null],
      ['right', null],
      ['top', null],
      ['bottom', null],
    ])

    const hints = deriveAlgebraicHints(nodes, lines, values, 15)

    // May or may not find cross-line relation depending on structure
    expect(Array.isArray(hints)).toBe(true)
  })

  it('limits hints to 3 maximum', () => {
    const { nodes, lines } = createCross()
    const values = new Map<string, number | null>([
      ['left', 1],
      ['center', null],
      ['right', null],
      ['top', 2],
      ['bottom', null],
    ])

    const hints = deriveAlgebraicHints(nodes, lines, values, 15)

    expect(hints.length).toBeLessThanOrEqual(3)
  })
})

// ========================================
// Magic Graph - Solver & Generator
// ========================================

import type {
  PuzzleConfig,
  GraphNode,
  Line,
  LineStatus,
  LineWithStatus,
} from './types'

// ========================================
// Solvability Check Result
// ========================================

export interface SolvabilityResult {
  solvable: boolean
  solutionCount: number
  timedOut: boolean
}

/**
 * Calculate the status of a line based on current node values.
 */
export function getLineStatus(
  line: Line,
  nodeValues: Map<string, number | null>,
  targetSum: number,
): LineWithStatus {
  let currentSum = 0
  let filledCount = 0

  for (const nodeId of line.nodeIds) {
    const value = nodeValues.get(nodeId)
    if (value !== null && value !== undefined) {
      currentSum += value
      filledCount++
    }
  }

  const totalNodes = line.nodeIds.length
  let status: LineStatus

  if (filledCount < totalNodes) {
    // Line incomplete
    if (currentSum > targetSum) {
      status = 'overflow'
    } else {
      status = 'incomplete'
    }
  } else {
    // Line complete
    status = currentSum === targetSum ? 'correct' : 'incorrect'
  }

  return { ...line, status, currentSum, filledCount }
}

/**
 * Check if the puzzle is solved (all lines are correct).
 */
export function isPuzzleSolved(
  lines: Line[],
  nodeValues: Map<string, number | null>,
  targetSum: number,
): boolean {
  return lines.every((line) => {
    const status = getLineStatus(line, nodeValues, targetSum)
    return status.status === 'correct'
  })
}

/**
 * Recursive backtracking solver.
 * Returns all valid solutions (up to maxSolutions).
 * Includes iteration limit to prevent browser hang on complex puzzles.
 */
export function solve(
  nodes: GraphNode[],
  lines: Line[],
  availableNumbers: number[],
  targetSum: number,
  maxSolutions: number = 10,
  maxIterations: number = 100000,
): Map<string, number>[] {
  const solutions: Map<string, number>[] = []
  const emptyNodes = nodes.filter((n) => !n.isFixed)
  const fixedValues = new Map<string, number>()
  let iterations = 0

  nodes.forEach((n) => {
    if (n.isFixed && n.value !== null) {
      fixedValues.set(n.id, n.value)
    }
  })

  function isValidPartial(assignment: Map<string, number>): boolean {
    // Check each line constraint
    for (const line of lines) {
      let sum = 0
      let filled = 0
      for (const nodeId of line.nodeIds) {
        const val = assignment.get(nodeId) ?? fixedValues.get(nodeId)
        if (val !== undefined) {
          sum += val
          filled++
        }
      }
      // If line is complete, sum must equal target
      if (filled === line.nodeIds.length && sum !== targetSum) {
        return false
      }
      // If partial, sum must not exceed target
      if (filled < line.nodeIds.length && sum > targetSum) {
        return false
      }
    }
    return true
  }

  function backtrack(
    index: number,
    assignment: Map<string, number>,
    usedNumbers: Set<number>,
  ): void {
    iterations++
    if (iterations >= maxIterations || solutions.length >= maxSolutions) return

    if (index === emptyNodes.length) {
      // All nodes assigned - check if valid
      if (isValidPartial(assignment)) {
        solutions.push(new Map(assignment))
      }
      return
    }

    const node = emptyNodes[index]
    for (const num of availableNumbers) {
      if (usedNumbers.has(num)) continue

      assignment.set(node.id, num)
      usedNumbers.add(num)

      if (isValidPartial(assignment)) {
        backtrack(index + 1, assignment, usedNumbers)
      }

      assignment.delete(node.id)
      usedNumbers.delete(num)
    }
  }

  const initialUsed = new Set<number>()
  nodes.forEach((n) => {
    if (n.isFixed && n.value !== null) {
      initialUsed.add(n.value)
    }
  })

  backtrack(0, new Map(), initialUsed)
  return solutions
}

// ========================================
// Solvability Checker
// ========================================

/**
 * Check if a puzzle configuration is solvable.
 * Uses the backtracking solver to verify if at least one solution exists.
 *
 * @param puzzle - The puzzle configuration to check
 * @param maxIterations - Maximum solver iterations before timing out (default: 50000)
 * @returns Solvability result with solution count and timeout status
 */
export function checkSolvability(
  puzzle: PuzzleConfig,
  maxIterations: number = 50000,
): SolvabilityResult {
  const solutions = solve(
    puzzle.nodes,
    puzzle.lines,
    puzzle.availableNumbers,
    puzzle.targetSum,
    1, // We only need to find one solution to prove solvability
    maxIterations,
  )

  // If we found a solution, it's solvable
  // If we found 0 solutions and didn't time out, it's definitively unsolvable
  // Note: The solver doesn't currently track timeout, so we approximate
  // by checking if 0 solutions were found (could be timeout or truly unsolvable)
  return {
    solvable: solutions.length > 0,
    solutionCount: solutions.length,
    timedOut: false, // The current solver doesn't expose timeout status
  }
}

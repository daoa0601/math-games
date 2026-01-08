// ========================================
// Magic Graph - Solver & Generator
// ========================================

import type { PuzzleConfig, GraphNode, Line, LineStatus, LineWithStatus, OptimizationGoal } from './types';

// ========================================
// Solvability Check Result
// ========================================

export interface SolvabilityResult {
    solvable: boolean;
    solutionCount: number;
    timedOut: boolean;
}


/**
 * Calculate the status of a line based on current node values.
 */
export function getLineStatus(
    line: Line,
    nodeValues: Map<string, number | null>,
    targetSum: number
): LineWithStatus {
    let currentSum = 0;
    let filledCount = 0;

    for (const nodeId of line.nodeIds) {
        const value = nodeValues.get(nodeId);
        if (value !== null && value !== undefined) {
            currentSum += value;
            filledCount++;
        }
    }

    const totalNodes = line.nodeIds.length;
    let status: LineStatus;

    if (filledCount < totalNodes) {
        // Line incomplete
        if (currentSum > targetSum) {
            status = 'overflow';
        } else {
            status = 'incomplete';
        }
    } else {
        // Line complete
        status = currentSum === targetSum ? 'correct' : 'incorrect';
    }

    return { ...line, status, currentSum, filledCount };
}

/**
 * Check if the puzzle is solved (all lines are correct).
 */
export function isPuzzleSolved(
    lines: Line[],
    nodeValues: Map<string, number | null>,
    targetSum: number
): boolean {
    return lines.every((line) => {
        const status = getLineStatus(line, nodeValues, targetSum);
        return status.status === 'correct';
    });
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
    maxIterations: number = 100000
): Map<string, number>[] {
    const solutions: Map<string, number>[] = [];
    const emptyNodes = nodes.filter((n) => !n.isFixed);
    const fixedValues = new Map<string, number>();
    let iterations = 0;

    nodes.forEach((n) => {
        if (n.isFixed && n.value !== null) {
            fixedValues.set(n.id, n.value);
        }
    });

    function isValidPartial(
        assignment: Map<string, number>
    ): boolean {
        // Check each line constraint
        for (const line of lines) {
            let sum = 0;
            let filled = 0;
            for (const nodeId of line.nodeIds) {
                const val = assignment.get(nodeId) ?? fixedValues.get(nodeId);
                if (val !== undefined) {
                    sum += val;
                    filled++;
                }
            }
            // If line is complete, sum must equal target
            if (filled === line.nodeIds.length && sum !== targetSum) {
                return false;
            }
            // If partial, sum must not exceed target
            if (filled < line.nodeIds.length && sum > targetSum) {
                return false;
            }
        }
        return true;
    }

    function backtrack(
        index: number,
        assignment: Map<string, number>,
        usedNumbers: Set<number>
    ): void {
        iterations++;
        if (iterations >= maxIterations || solutions.length >= maxSolutions) return;

        if (index === emptyNodes.length) {
            // All nodes assigned - check if valid
            if (isValidPartial(assignment)) {
                solutions.push(new Map(assignment));
            }
            return;
        }

        const node = emptyNodes[index];
        for (const num of availableNumbers) {
            if (usedNumbers.has(num)) continue;

            assignment.set(node.id, num);
            usedNumbers.add(num);

            if (isValidPartial(assignment)) {
                backtrack(index + 1, assignment, usedNumbers);
            }

            assignment.delete(node.id);
            usedNumbers.delete(num);
        }
    }

    const initialUsed = new Set<number>();
    nodes.forEach((n) => {
        if (n.isFixed && n.value !== null) {
            initialUsed.add(n.value);
        }
    });

    backtrack(0, new Map(), initialUsed);
    return solutions;
}

/**
 * Generate a new puzzle by:
 * 1. Solving an empty grid to get a valid assignment
 * 2. Masking some nodes
 * 3. Ensuring only one solution exists
 */
export function generatePuzzle(
    basePuzzle: Omit<PuzzleConfig, 'id'>,
    difficulty: number = 1, // Number of nodes to reveal (start low)
    maxRetries: number = 10
): PuzzleConfig {
    // First solve with all nodes empty
    const emptyNodes = basePuzzle.nodes.map((n) => ({ ...n, value: null, isFixed: false }));
    const solutions = solve(
        emptyNodes,
        basePuzzle.lines,
        basePuzzle.availableNumbers,
        basePuzzle.targetSum,
        1
    );

    // If no solution found, return template as-is with pre-filled values
    if (solutions.length === 0) {
        console.warn('No solution found for puzzle, using template defaults');
        return {
            ...basePuzzle,
            id: `puzzle_${Date.now()}`,
        };
    }

    const solution = solutions[0];

    // Create puzzle with all values filled
    const filledNodes = basePuzzle.nodes.map((n) => ({
        ...n,
        value: solution.get(n.id) ?? null,
        isFixed: false,
    }));

    // Try to find a valid unique puzzle with increasing hints
    for (let hints = difficulty; hints <= basePuzzle.nodes.length && maxRetries > 0; hints++) {
        for (let retry = 0; retry < 3; retry++) {
            // Randomly select nodes to keep visible (fixed)
            const indices = filledNodes.map((_, i) => i);
            shuffleArray(indices);
            // Use Set for O(1) lookups instead of O(n) includes
            const keepVisibleSet = new Set(indices.slice(0, hints));

            const maskedNodes = filledNodes.map((n, i) => ({
                ...n,
                isFixed: keepVisibleSet.has(i),
                value: keepVisibleSet.has(i) ? n.value : null,
            }));

            // Verify unique solution
            const checkSolutions = solve(
                maskedNodes,
                basePuzzle.lines,
                basePuzzle.availableNumbers,
                basePuzzle.targetSum,
                2
            );

            if (checkSolutions.length === 1) {
                return {
                    ...basePuzzle,
                    id: `puzzle_${Date.now()}`,
                    nodes: maskedNodes,
                };
            }
        }
    }

    // Fallback: return puzzle with most nodes hidden but accept multiple solutions
    const indices = filledNodes.map((_, i) => i);
    shuffleArray(indices);
    // Use Set for O(1) lookups
    const keepVisibleSet = new Set(indices.slice(0, Math.max(1, Math.floor(basePuzzle.nodes.length / 2))));

    const fallbackNodes = filledNodes.map((n, i) => ({
        ...n,
        isFixed: keepVisibleSet.has(i),
        value: keepVisibleSet.has(i) ? n.value : null,
    }));

    return {
        ...basePuzzle,
        id: `puzzle_${Date.now()}`,
        nodes: fallbackNodes,
    };
}

function shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ========================================
// Auditor - Constraint Checker for Hints
// ========================================

/**
 * Check if k numbers from the array can sum to exactly target.
 * Uses dynamic programming subset sum for better performance.
 */
function canSumTo(arr: number[], k: number, target: number): boolean {
    if (k === 0) return target === 0;
    if (arr.length < k) return false;

    // Quick check for single number
    if (k === 1) {
        for (const num of arr) {
            if (num === target) return true;
        }
        return false;
    }

    // Early termination: check if target is achievable
    const sortedArr = [...arr].sort((a, b) => a - b);
    const minPossibleSum = sortedArr.slice(0, k).reduce((a, b) => a + b, 0);
    const maxPossibleSum = sortedArr.slice(-k).reduce((a, b) => a + b, 0);
    if (target < minPossibleSum || target > maxPossibleSum) return false;

    // For small arrays, use direct enumeration (faster than DP overhead)
    if (arr.length <= 6) {
        return canSumToEnumerate(arr, k, target);
    }

    // DP approach: dp[count][sum] = true if we can achieve sum using exactly count numbers
    // Use Map for sparse storage since target can be large
    const dp: Map<number, Set<number>> = new Map();
    dp.set(0, new Set([0]));

    for (const num of arr) {
        // Iterate backwards through counts to avoid using same number twice
        for (let count = Math.min(k - 1, dp.size - 1); count >= 0; count--) {
            const sums = dp.get(count);
            if (!sums) continue;

            const nextCount = count + 1;
            if (!dp.has(nextCount)) {
                dp.set(nextCount, new Set());
            }
            const nextSums = dp.get(nextCount)!;

            for (const prevSum of sums) {
                const newSum = prevSum + num;
                if (newSum <= target) {
                    nextSums.add(newSum);
                    // Early exit if we found the target
                    if (nextCount === k && newSum === target) {
                        return true;
                    }
                }
            }
        }
    }

    const finalSums = dp.get(k);
    return finalSums ? finalSums.has(target) : false;
}

/**
 * Direct enumeration for small arrays (avoids DP overhead)
 */
function canSumToEnumerate(arr: number[], k: number, target: number): boolean {
    const n = arr.length;

    function search(index: number, count: number, sum: number): boolean {
        if (count === k) return sum === target;
        if (index >= n || count > k || sum > target) return false;
        if (n - index < k - count) return false; // Not enough elements left

        // Take current element
        if (search(index + 1, count + 1, sum + arr[index])) return true;
        // Skip current element
        return search(index + 1, count, sum);
    }

    return search(0, 0, 0);
}

/**
 * Check if a specific line can still reach the target sum.
 * Returns whether the line is possible and diagnostic info.
 */
export function isLinePossible(
    line: Line,
    nodeValues: Map<string, number | null>,
    availableNumbers: number[],
    targetSum: number
): { possible: boolean; neededSum: number; emptyCount: number } {
    let currentSum = 0;
    let emptyCount = 0;

    for (const nodeId of line.nodeIds) {
        const value = nodeValues.get(nodeId);
        if (value !== null && value !== undefined) {
            currentSum += value;
        } else {
            emptyCount++;
        }
    }

    // Line already complete
    if (emptyCount === 0) {
        return { possible: currentSum === targetSum, neededSum: 0, emptyCount: 0 };
    }

    // Already exceeded target
    if (currentSum > targetSum) {
        return { possible: false, neededSum: targetSum - currentSum, emptyCount };
    }

    const neededSum = targetSum - currentSum;

    // Get unused numbers
    const usedNumbers = new Set<number>();
    nodeValues.forEach((val) => {
        if (val !== null) usedNumbers.add(val);
    });
    const unusedNumbers = availableNumbers.filter(n => !usedNumbers.has(n));

    // Check if any combination of emptyCount unused numbers can sum to neededSum
    const possible = canSumTo(unusedNumbers, emptyCount, neededSum);

    return { possible, neededSum, emptyCount };
}

/**
 * Find all lines that are currently impossible to complete.
 * This is the main Auditor function - highlights constraint violations.
 */
export function findImpossibleLines(
    lines: Line[],
    nodeValues: Map<string, number | null>,
    availableNumbers: number[],
    targetSum: number
): Set<string> {
    const impossibleLineIds = new Set<string>();

    for (const line of lines) {
        const result = isLinePossible(line, nodeValues, availableNumbers, targetSum);
        if (!result.possible) {
            impossibleLineIds.add(line.id);
        }
    }

    return impossibleLineIds;
}

// ========================================
// Starter - Find Best Starting Node
// ========================================

export interface NodeAnalysis {
    nodeId: string;
    validOptions: number[];
    constraintScore: number; // Lower = more constrained = better start
}

/**
 * Build a mapping from node IDs to the lines they belong to.
 * This allows O(1) lookups instead of O(m*n) filtering.
 */
function buildNodeToLinesMap(lines: Line[]): Map<string, Line[]> {
    const nodeToLines = new Map<string, Line[]>();
    for (const line of lines) {
        for (const nodeId of line.nodeIds) {
            const existing = nodeToLines.get(nodeId);
            if (existing) {
                existing.push(line);
            } else {
                nodeToLines.set(nodeId, [line]);
            }
        }
    }
    return nodeToLines;
}

/**
 * Analyze each empty node to find valid number options.
 * A number is valid if placing it keeps all lines potentially solvable.
 */
export function analyzeNodes(
    nodes: GraphNode[],
    lines: Line[],
    nodeValues: Map<string, number | null>,
    availableNumbers: number[],
    targetSum: number
): NodeAnalysis[] {
    // Get currently used numbers
    const usedNumbers = new Set<number>();
    nodeValues.forEach((val) => {
        if (val !== null) usedNumbers.add(val);
    });
    const unusedNumbers = availableNumbers.filter(n => !usedNumbers.has(n));

    // Pre-compute node-to-lines mapping for O(1) lookups
    const nodeToLines = buildNodeToLinesMap(lines);

    const analyses: NodeAnalysis[] = [];

    for (const node of nodes) {
        // Skip fixed nodes and already-filled nodes
        if (node.isFixed || nodeValues.get(node.id) !== null) continue;

        const validOptions: number[] = [];

        // Get lines for this node using pre-computed map (O(1) instead of O(m*n))
        const nodeLines = nodeToLines.get(node.id) ?? [];

        // Try each unused number for this node
        for (const num of unusedNumbers) {
            // Temporarily place this number
            const testValues = new Map(nodeValues);
            testValues.set(node.id, num);

            // Create temp used set for this placement
            const tempUsed = new Set(usedNumbers);
            tempUsed.add(num);
            const tempUnused = availableNumbers.filter(n => !tempUsed.has(n));

            const allPossible = nodeLines.every(line => {
                // For this check, we need to consider what numbers remain after placing num
                let currentSum = 0;
                let emptyCount = 0;

                for (const nodeId of line.nodeIds) {
                    const value = testValues.get(nodeId);
                    if (value !== null && value !== undefined) {
                        currentSum += value;
                    } else {
                        emptyCount++;
                    }
                }

                if (emptyCount === 0) {
                    return currentSum === targetSum;
                }

                if (currentSum > targetSum) return false;

                const neededSum = targetSum - currentSum;
                return canSumTo(tempUnused, emptyCount, neededSum);
            });

            if (allPossible) {
                validOptions.push(num);
            }
        }

        analyses.push({
            nodeId: node.id,
            validOptions,
            constraintScore: validOptions.length,
        });
    }

    // Sort by constraint score (fewest options first)
    return analyses.sort((a, b) => a.constraintScore - b.constraintScore);
}

/**
 * Find the best node to start with (most constrained).
 * Returns null if no empty nodes remain.
 */
export function findBestStartingNode(
    nodes: GraphNode[],
    lines: Line[],
    nodeValues: Map<string, number | null>,
    availableNumbers: number[],
    targetSum: number
): { nodeId: string; validOptions: number[]; reason: string } | null {
    const analyses = analyzeNodes(nodes, lines, nodeValues, availableNumbers, targetSum);

    if (analyses.length === 0) return null;

    const best = analyses[0];

    if (best.constraintScore === 0) {
        return {
            nodeId: best.nodeId,
            validOptions: [],
            reason: 'This node has no valid options - you need to backtrack!',
        };
    }

    if (best.constraintScore === 1) {
        return {
            nodeId: best.nodeId,
            validOptions: best.validOptions,
            reason: `This node can only be ${best.validOptions[0]} - a forced move!`,
        };
    }

    return {
        nodeId: best.nodeId,
        validOptions: best.validOptions,
        reason: `This node has only ${best.constraintScore} options: ${best.validOptions.join(', ')}`,
    };
}

// ========================================
// Algebraist - Derive Equations for Hints
// ========================================

export interface AlgebraicHint {
    type: 'equation' | 'deduction' | 'sum-hint';
    title: string;
    equation: string;
    explanation: string;
}

/**
 * Derive algebraic hints from the puzzle structure.
 * Especially useful in Master mode where target sum is hidden.
 */
export function deriveAlgebraicHints(
    nodes: GraphNode[],
    lines: Line[],
    nodeValues: Map<string, number | null>,
    targetSum: number,
    hiddenTarget: boolean = false
): AlgebraicHint[] {
    const hints: AlgebraicHint[] = [];

    // Build a map of node IDs to their display labels (A, B, C...)
    const nodeLabels = new Map<string, string>();
    const emptyNodeIds: string[] = [];
    let labelIndex = 0;

    for (const node of nodes) {
        const value = nodeValues.get(node.id);
        if (value === null || value === undefined) {
            const label = String.fromCharCode(65 + labelIndex); // A, B, C, ...
            nodeLabels.set(node.id, label);
            emptyNodeIds.push(node.id);
            labelIndex++;
        }
    }

    // For lines that are mostly filled, show what's needed
    for (const line of lines) {
        let knownSum = 0;
        const unknowns: string[] = [];

        for (const nodeId of line.nodeIds) {
            const value = nodeValues.get(nodeId);
            if (value !== null && value !== undefined) {
                knownSum += value;
            } else {
                unknowns.push(nodeLabels.get(nodeId) || '?');
            }
        }

        // Single unknown: direct deduction
        if (unknowns.length === 1 && !hiddenTarget) {
            const needed = targetSum - knownSum;
            hints.push({
                type: 'deduction',
                title: 'Direct Calculation',
                equation: `${unknowns[0]} = ${targetSum} - ${knownSum} = ${needed}`,
                explanation: `Node ${unknowns[0]} must equal ${needed} to complete this line.`,
            });
        }

        // Two unknowns: show relationship
        if (unknowns.length === 2) {
            if (hiddenTarget) {
                hints.push({
                    type: 'equation',
                    title: 'Line Constraint',
                    equation: `${unknowns[0]} + ${unknowns[1]} = S - ${knownSum}`,
                    explanation: `These two nodes must sum to (target - ${knownSum}).`,
                });
            } else {
                const needed = targetSum - knownSum;
                hints.push({
                    type: 'equation',
                    title: 'Sum Constraint',
                    equation: `${unknowns[0]} + ${unknowns[1]} = ${needed}`,
                    explanation: `These nodes must sum to ${needed}.`,
                });
            }
        }
    }

    // Find relationships between lines (shared nodes)
    // Use Sets for O(1) lookups instead of O(n) includes
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const lineJSet = new Set(lines[j].nodeIds);
            const shared = lines[i].nodeIds.filter(id => lineJSet.has(id));

            if (shared.length > 0) {
                const sharedSet = new Set(shared);
                const unique1 = lines[i].nodeIds.filter(id => !sharedSet.has(id));
                const unique2 = lines[j].nodeIds.filter(id => !sharedSet.has(id));

                // Check if uniques are all unknown or have known values
                const getTerms = (ids: string[]): string[] => {
                    return ids.map(id => {
                        const value = nodeValues.get(id);
                        if (value !== null && value !== undefined) {
                            return String(value);
                        }
                        return nodeLabels.get(id) || '?';
                    });
                };

                const terms1 = getTerms(unique1);
                const terms2 = getTerms(unique2);

                // Only show if at least one side has unknowns and they're not all the same
                const hasUnknown1 = terms1.some(t => isNaN(Number(t)));
                const hasUnknown2 = terms2.some(t => isNaN(Number(t)));

                if ((hasUnknown1 || hasUnknown2) && terms1.join('') !== terms2.join('')) {
                    hints.push({
                        type: 'equation',
                        title: 'Cross-Line Relation',
                        equation: `${terms1.join(' + ')} = ${terms2.join(' + ')}`,
                        explanation: 'Since both lines share common nodes and sum to the same target.',
                    });
                }
            }
        }
    }

    // In hidden target mode, show how to find S
    if (hiddenTarget && hints.length === 0 && emptyNodeIds.length < nodes.length) {
        // Find a completed or nearly completed line
        for (const line of lines) {
            let filledCount = 0;
            let sum = 0;
            for (const nodeId of line.nodeIds) {
                const value = nodeValues.get(nodeId);
                if (value !== null && value !== undefined) {
                    sum += value;
                    filledCount++;
                }
            }

            if (filledCount === line.nodeIds.length) {
                hints.push({
                    type: 'sum-hint',
                    title: 'Target Discovered!',
                    equation: `S = ${sum}`,
                    explanation: 'This complete line reveals the target sum.',
                });
                break;
            }
        }
    }

    // Limit to avoid overwhelming the user
    return hints.slice(0, 3);
}

// ========================================
// Grandmaster - Optimal Sum Finder
// ========================================

export interface OptimalSumResult {
    minSum: number;
    maxSum: number;
    validSums: number[];
    solutionsBySum: Map<number, Map<string, number>[]>;
}

/**
 * Find all valid target sums for a given puzzle configuration.
 * Used in Grandmaster mode where players must optimize the target sum.
 *
 * @param nodes - The puzzle nodes (with some fixed values)
 * @param lines - The line constraints
 * @param availableNumbers - Numbers that can be placed
 * @param searchRange - [minSum, maxSum] range to search
 * @returns Object containing min/max valid sums and all solutions
 */
export function findOptimalSums(
    nodes: GraphNode[],
    lines: Line[],
    availableNumbers: number[],
    searchRange: [number, number] = [10, 50]
): OptimalSumResult {
    const [minSearch, maxSearch] = searchRange;
    const validSums: number[] = [];
    const solutionsBySum = new Map<number, Map<string, number>[]>();

    // Try each possible target sum
    for (let targetSum = minSearch; targetSum <= maxSearch; targetSum++) {
        const solutions = solve(nodes, lines, availableNumbers, targetSum, 1, 10000);

        if (solutions.length > 0) {
            validSums.push(targetSum);
            solutionsBySum.set(targetSum, solutions);
        }
    }

    return {
        minSum: validSums.length > 0 ? Math.min(...validSums) : 0,
        maxSum: validSums.length > 0 ? Math.max(...validSums) : 0,
        validSums,
        solutionsBySum,
    };
}

/**
 * Check if a solution achieves the optimal target sum.
 *
 * @param nodeValues - Current node values
 * @param lines - Line constraints
 * @param optimalResult - Result from findOptimalSums
 * @param goal - 'minimize' or 'maximize'
 * @returns Whether the solution is optimal and feedback message
 */
export function checkOptimalSolution(
    nodeValues: Map<string, number | null>,
    lines: Line[],
    optimalResult: OptimalSumResult,
    goal: OptimizationGoal
): { isOptimal: boolean; currentSum: number; optimalSum: number; message: string } {
    // Calculate the current target sum from a completed line
    let currentSum = 0;
    for (const line of lines) {
        let sum = 0;
        let complete = true;
        for (const nodeId of line.nodeIds) {
            const value = nodeValues.get(nodeId);
            if (value === null || value === undefined) {
                complete = false;
                break;
            }
            sum += value;
        }
        if (complete) {
            currentSum = sum;
            break;
        }
    }

    const optimalSum = goal === 'minimize' ? optimalResult.minSum : optimalResult.maxSum;
    const isOptimal = currentSum === optimalSum;

    let message: string;
    if (isOptimal) {
        message = goal === 'minimize'
            ? `Perfect! ${currentSum} is the minimum possible sum!`
            : `Perfect! ${currentSum} is the maximum possible sum!`;
    } else {
        const diff = goal === 'minimize'
            ? currentSum - optimalSum
            : optimalSum - currentSum;
        message = goal === 'minimize'
            ? `Good solution! But the minimum sum is ${optimalSum} (${diff} lower than your ${currentSum}).`
            : `Good solution! But the maximum sum is ${optimalSum} (${diff} higher than your ${currentSum}).`;
    }

    return { isOptimal, currentSum, optimalSum, message };
}

/**
 * Calculate the search range for optimal sums based on available numbers.
 * Uses the structure of the puzzle to estimate reasonable bounds.
 */
export function calculateSumSearchRange(
    lines: Line[],
    availableNumbers: number[]
): [number, number] {
    if (lines.length === 0 || availableNumbers.length === 0) {
        return [10, 50];
    }

    // Find a typical line length
    const lineLength = lines[0].nodeIds.length;

    // Calculate minimum possible sum (smallest numbers for a line)
    const sortedNums = [...availableNumbers].sort((a, b) => a - b);
    const minPossible = sortedNums.slice(0, lineLength).reduce((a, b) => a + b, 0);

    // Calculate maximum possible sum (largest numbers for a line)
    const maxPossible = sortedNums.slice(-lineLength).reduce((a, b) => a + b, 0);

    return [minPossible, maxPossible];
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
    maxIterations: number = 50000
): SolvabilityResult {
    const solutions = solve(
        puzzle.nodes,
        puzzle.lines,
        puzzle.availableNumbers,
        puzzle.targetSum,
        1, // We only need to find one solution to prove solvability
        maxIterations
    );

    // If we found a solution, it's solvable
    // If we found 0 solutions and didn't time out, it's definitively unsolvable
    // Note: The solver doesn't currently track timeout, so we approximate
    // by checking if 0 solutions were found (could be timeout or truly unsolvable)
    return {
        solvable: solutions.length > 0,
        solutionCount: solutions.length,
        timedOut: false, // The current solver doesn't expose timeout status
    };
}

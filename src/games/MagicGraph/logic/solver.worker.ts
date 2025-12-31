// ========================================
// Magic Graph - Solver Web Worker
// Offloads CPU-intensive solve/generate to background thread
// ========================================

import type { PuzzleConfig, GraphNode, Line } from './types';

// Worker message types
export interface SolveRequest {
    type: 'solve';
    id: string;
    nodes: GraphNode[];
    lines: Line[];
    availableNumbers: number[];
    targetSum: number;
    maxSolutions?: number;
    maxIterations?: number;
}

export interface GenerateRequest {
    type: 'generate';
    id: string;
    basePuzzle: Omit<PuzzleConfig, 'id'>;
    difficulty?: number;
    maxRetries?: number;
}

export type WorkerRequest = SolveRequest | GenerateRequest;

export interface SolveResponse {
    type: 'solve-result';
    id: string;
    solutions: Array<[string, number][]>; // Map entries as array for serialization
    success: true;
}

export interface GenerateResponse {
    type: 'generate-result';
    id: string;
    puzzle: PuzzleConfig;
    success: true;
}

export interface ErrorResponse {
    type: 'error';
    id: string;
    error: string;
    success: false;
}

export type WorkerResponse = SolveResponse | GenerateResponse | ErrorResponse;

// ========================================
// Solver Implementation (copied from solver.ts for worker isolation)
// ========================================

function shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function solve(
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

    function isValidPartial(assignment: Map<string, number>): boolean {
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
            if (filled === line.nodeIds.length && sum !== targetSum) {
                return false;
            }
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

function generatePuzzle(
    basePuzzle: Omit<PuzzleConfig, 'id'>,
    difficulty: number = 1,
    maxRetries: number = 10
): PuzzleConfig {
    const emptyNodes = basePuzzle.nodes.map((n) => ({ ...n, value: null, isFixed: false }));
    const solutions = solve(
        emptyNodes,
        basePuzzle.lines,
        basePuzzle.availableNumbers,
        basePuzzle.targetSum,
        1
    );

    if (solutions.length === 0) {
        console.warn('No solution found for puzzle, using template defaults');
        return {
            ...basePuzzle,
            id: `puzzle_${Date.now()}`,
        };
    }

    const solution = solutions[0];

    const filledNodes = basePuzzle.nodes.map((n) => ({
        ...n,
        value: solution.get(n.id) ?? null,
        isFixed: false,
    }));

    for (let hints = difficulty; hints <= basePuzzle.nodes.length && maxRetries > 0; hints++) {
        for (let retry = 0; retry < 3; retry++) {
            const indices = filledNodes.map((_, i) => i);
            shuffleArray(indices);
            const keepVisible = indices.slice(0, hints);

            const maskedNodes = filledNodes.map((n, i) => ({
                ...n,
                isFixed: keepVisible.includes(i),
                value: keepVisible.includes(i) ? n.value : null,
            }));

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

    const indices = filledNodes.map((_, i) => i);
    shuffleArray(indices);
    const keepVisible = indices.slice(0, Math.max(1, Math.floor(basePuzzle.nodes.length / 2)));

    const fallbackNodes = filledNodes.map((n, i) => ({
        ...n,
        isFixed: keepVisible.includes(i),
        value: keepVisible.includes(i) ? n.value : null,
    }));

    return {
        ...basePuzzle,
        id: `puzzle_${Date.now()}`,
        nodes: fallbackNodes,
    };
}

// ========================================
// Worker Message Handler
// ========================================

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const request = event.data;

    try {
        if (request.type === 'solve') {
            const solutions = solve(
                request.nodes,
                request.lines,
                request.availableNumbers,
                request.targetSum,
                request.maxSolutions ?? 10,
                request.maxIterations ?? 100000
            );

            // Convert Map to array of entries for serialization
            const serializedSolutions = solutions.map(sol => Array.from(sol.entries()));

            const response: SolveResponse = {
                type: 'solve-result',
                id: request.id,
                solutions: serializedSolutions,
                success: true,
            };
            self.postMessage(response);
        } else if (request.type === 'generate') {
            const puzzle = generatePuzzle(
                request.basePuzzle,
                request.difficulty ?? 1,
                request.maxRetries ?? 10
            );

            const response: GenerateResponse = {
                type: 'generate-result',
                id: request.id,
                puzzle,
                success: true,
            };
            self.postMessage(response);
        }
    } catch (error) {
        const response: ErrorResponse = {
            type: 'error',
            id: request.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
        };
        self.postMessage(response);
    }
};

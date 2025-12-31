// ========================================
// useWorkerSolver - Hook for Web Worker Solver
// ========================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PuzzleConfig, GraphNode, Line } from '../logic/types';
import type { WorkerRequest, WorkerResponse } from '../logic/solver.worker';

// Import worker using Vite's worker syntax
import SolverWorker from '../logic/solver.worker?worker';

interface UseWorkerSolverReturn {
    /** Generate a puzzle asynchronously */
    generatePuzzle: (
        basePuzzle: Omit<PuzzleConfig, 'id'>,
        difficulty?: number
    ) => Promise<PuzzleConfig>;

    /** Solve a puzzle asynchronously */
    solve: (
        nodes: GraphNode[],
        lines: Line[],
        availableNumbers: number[],
        targetSum: number,
        maxSolutions?: number
    ) => Promise<Map<string, number>[]>;

    /** Whether the worker is currently processing */
    isWorking: boolean;

    /** Any error from the last operation */
    error: string | null;

    /** Cancel any pending operations */
    cancel: () => void;
}

/**
 * Hook for offloading solver operations to a Web Worker.
 * Prevents UI blocking during puzzle generation and solving.
 */
export function useWorkerSolver(): UseWorkerSolverReturn {
    const [isWorking, setIsWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const pendingRequestsRef = useRef<Map<string, {
        resolve: (value: unknown) => void;
        reject: (error: Error) => void;
    }>>(new Map());

    // Initialize worker
    useEffect(() => {
        workerRef.current = new SolverWorker();

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const response = event.data;
            const pending = pendingRequestsRef.current.get(response.id);

            if (!pending) return;

            pendingRequestsRef.current.delete(response.id);

            // Update isWorking based on remaining requests
            if (pendingRequestsRef.current.size === 0) {
                setIsWorking(false);
            }

            if (!response.success) {
                setError(response.error);
                pending.reject(new Error(response.error));
                return;
            }

            setError(null);

            if (response.type === 'solve-result') {
                // Convert serialized solutions back to Maps
                const solutions = response.solutions.map(
                    entries => new Map<string, number>(entries)
                );
                pending.resolve(solutions);
            } else if (response.type === 'generate-result') {
                pending.resolve(response.puzzle);
            }
        };

        workerRef.current.onerror = (event) => {
            console.error('Worker error:', event);
            setError(event.message);
            setIsWorking(false);

            // Reject all pending requests
            pendingRequestsRef.current.forEach((pending) => {
                pending.reject(new Error(event.message));
            });
            pendingRequestsRef.current.clear();
        };

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    // Generate unique request ID
    const generateId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Send request to worker and wait for response
    const sendRequest = useCallback(<T,>(request: WorkerRequest): Promise<T> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current) {
                reject(new Error('Worker not initialized'));
                return;
            }

            setIsWorking(true);
            setError(null);

            pendingRequestsRef.current.set(request.id, {
                resolve: resolve as (value: unknown) => void,
                reject,
            });

            workerRef.current.postMessage(request);
        });
    }, []);

    // Generate puzzle
    const generatePuzzle = useCallback(async (
        basePuzzle: Omit<PuzzleConfig, 'id'>,
        difficulty: number = 1
    ): Promise<PuzzleConfig> => {
        const request: WorkerRequest = {
            type: 'generate',
            id: generateId(),
            basePuzzle,
            difficulty,
        };

        return sendRequest<PuzzleConfig>(request);
    }, [generateId, sendRequest]);

    // Solve puzzle
    const solve = useCallback(async (
        nodes: GraphNode[],
        lines: Line[],
        availableNumbers: number[],
        targetSum: number,
        maxSolutions: number = 10
    ): Promise<Map<string, number>[]> => {
        const request: WorkerRequest = {
            type: 'solve',
            id: generateId(),
            nodes,
            lines,
            availableNumbers,
            targetSum,
            maxSolutions,
        };

        return sendRequest<Map<string, number>[]>(request);
    }, [generateId, sendRequest]);

    // Cancel pending operations
    const cancel = useCallback(() => {
        if (workerRef.current) {
            // Terminate and recreate worker to cancel
            workerRef.current.terminate();
            workerRef.current = new SolverWorker();

            // Reject all pending
            pendingRequestsRef.current.forEach((pending) => {
                pending.reject(new Error('Cancelled'));
            });
            pendingRequestsRef.current.clear();
            setIsWorking(false);
        }
    }, []);

    return {
        generatePuzzle,
        solve,
        isWorking,
        error,
        cancel,
    };
}

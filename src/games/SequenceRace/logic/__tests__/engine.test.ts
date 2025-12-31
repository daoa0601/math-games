import { describe, it, expect } from 'vitest';
import {
    createGameState,
    getValidMoves,
    isValidMove,
    applyMove,
    getAIMove,
    analyzePosition,
    validateGameFairness,
} from '../engine';
import type { GameConfig, SequenceState } from '../types';

describe('SequenceRace Engine', () => {
    const testConfig: GameConfig = {
        id: 'test',
        name: 'Test Game',
        target: 10,
        stepPool: [1, 2, 3, 4],
        difficulty: 'medium',
    };

    describe('createGameState', () => {
        it('creates initial state from config', () => {
            const state = createGameState(testConfig);

            expect(state.target).toBe(10);
            expect(state.currentPosition).toBe(0);
            expect(state.availableSteps).toEqual([1, 2, 3, 4]);
            expect(state.turn).toBe('player');
            expect(state.history).toEqual([]);
            expect(state.winner).toBeNull();
            expect(state.gameOver).toBe(false);
        });

        it('creates a copy of stepPool (not reference)', () => {
            const state = createGameState(testConfig);
            state.availableSteps.push(99);

            expect(testConfig.stepPool).not.toContain(99);
        });
    });

    describe('getValidMoves', () => {
        it('returns all steps that do not exceed target', () => {
            const state = createGameState(testConfig);
            const moves = getValidMoves(state);

            expect(moves).toEqual([1, 2, 3, 4]);
        });

        it('excludes steps that would exceed target', () => {
            const state: SequenceState = {
                ...createGameState(testConfig),
                currentPosition: 8,
            };
            const moves = getValidMoves(state);

            expect(moves).toEqual([1, 2]);
        });

        it('returns empty array when no valid moves', () => {
            const state: SequenceState = {
                ...createGameState(testConfig),
                currentPosition: 10,
            };
            const moves = getValidMoves(state);

            expect(moves).toEqual([]);
        });
    });

    describe('isValidMove', () => {
        it('returns true for valid moves', () => {
            const state = createGameState(testConfig);

            expect(isValidMove(state, 1)).toBe(true);
            expect(isValidMove(state, 4)).toBe(true);
        });

        it('returns false for moves exceeding target', () => {
            const state: SequenceState = {
                ...createGameState(testConfig),
                currentPosition: 9,
            };

            expect(isValidMove(state, 2)).toBe(false);
        });

        it('returns false for unavailable steps', () => {
            const state: SequenceState = {
                ...createGameState(testConfig),
                availableSteps: [1, 2],
            };

            expect(isValidMove(state, 4)).toBe(false);
        });
    });

    describe('applyMove', () => {
        it('updates position correctly', () => {
            const state = createGameState(testConfig);
            const newState = applyMove(state, 3);

            expect(newState.currentPosition).toBe(3);
        });

        it('removes used step from available', () => {
            const state = createGameState(testConfig);
            const newState = applyMove(state, 2);

            expect(newState.availableSteps).not.toContain(2);
        });

        it('switches turn', () => {
            const state = createGameState(testConfig);
            const newState = applyMove(state, 1);

            expect(newState.turn).toBe('ai');
        });

        it('records move in history', () => {
            const state = createGameState(testConfig);
            const newState = applyMove(state, 3);

            expect(newState.history).toHaveLength(1);
            expect(newState.history[0]).toEqual({
                actor: 'player',
                step: 3,
                position: 3,
            });
        });

        it('detects win when reaching target', () => {
            const state: SequenceState = {
                ...createGameState(testConfig),
                currentPosition: 7,
            };
            const newState = applyMove(state, 3);

            expect(newState.currentPosition).toBe(10);
            expect(newState.winner).toBe('player');
            expect(newState.gameOver).toBe(true);
        });

        it('detects win when opponent has no valid moves', () => {
            // Setup: position 9, only step 2 available (would exceed 10)
            const state: SequenceState = {
                ...createGameState(testConfig),
                currentPosition: 8,
                availableSteps: [1, 2],
            };
            const newState = applyMove(state, 1); // Move to 9, leave only 2

            // Next player (AI) would have no valid moves (only 2, but 9+2=11 > 10)
            expect(newState.winner).toBe('player');
            expect(newState.gameOver).toBe(true);
        });

        it('returns same state for invalid moves', () => {
            const state = createGameState(testConfig);
            const newState = applyMove(state, 99);

            expect(newState).toBe(state);
        });
    });

    describe('getAIMove', () => {
        it('returns a valid move on easy', () => {
            const state = createGameState(testConfig);
            const move = getAIMove(state, 'easy');

            expect(testConfig.stepPool).toContain(move);
        });

        it('returns a valid move on hard', () => {
            const state = createGameState(testConfig);
            const move = getAIMove(state, 'hard');

            expect(testConfig.stepPool).toContain(move);
        });

        it('throws when no valid moves', () => {
            const state: SequenceState = {
                ...createGameState(testConfig),
                currentPosition: 10,
                availableSteps: [1, 2],
            };

            expect(() => getAIMove(state, 'hard')).toThrow();
        });
    });

    describe('analyzePosition', () => {
        it('detects winning position', () => {
            const state: SequenceState = {
                ...createGameState(testConfig),
                currentPosition: 9,
                availableSteps: [1],
            };
            const analysis = analyzePosition(state);

            expect(analysis.canWin).toBe(true);
            expect(analysis.bestMove).toBe(1);
        });
    });

    describe('validateGameFairness', () => {
        it('returns fairness analysis for config', () => {
            const result = validateGameFairness(testConfig);

            expect(typeof result.isPlayerWinnable).toBe('boolean');
            expect(typeof result.isAIWinnable).toBe('boolean');
            expect(['player', 'ai', 'both', 'neither']).toContain(result.firstMoverAdvantage);
        });
    });
});

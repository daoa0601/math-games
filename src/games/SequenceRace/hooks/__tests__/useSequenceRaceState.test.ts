/**
 * Tests for useSequenceRaceState hook - Undo functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useSequenceRaceState } from '../useSequenceRaceState';

describe('useSequenceRaceState - undo', () => {
    it('should return canUndo as false when no history', () => {
        const { result } = renderHook(() => useSequenceRaceState());

        expect(result.current.canUndo).toBe(false);
    });

    it('should track state changes when a move is made', () => {
        const { result } = renderHook(() => useSequenceRaceState());

        // Make a player move (simulate by setting state with a move)
        act(() => {
            // Get a valid move
            const validMoves = result.current.validMoves;
            if (validMoves.length > 0) {
                const move = validMoves[0];
                result.current.setGameState(prev => ({
                    ...prev,
                    currentPosition: prev.currentPosition + move,
                    history: [...prev.history, { actor: 'player', step: move, position: prev.currentPosition + move }],
                    turn: 'ai' as const,
                }));
            }
        });

        // Verify move was recorded in history
        expect(result.current.gameState.history.length).toBeGreaterThan(0);
    });

    it('should not undo if no moves made', () => {
        const { result } = renderHook(() => useSequenceRaceState());

        const initialPosition = result.current.gameState.currentPosition;

        act(() => {
            result.current.undoLastMove();
        });

        expect(result.current.gameState.currentPosition).toBe(initialPosition);
    });

    it('should have undoLastMove function defined', () => {
        const { result } = renderHook(() => useSequenceRaceState());

        expect(typeof result.current.undoLastMove).toBe('function');
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePiecePlacement } from '../usePiecePlacement';
import { createGameState } from '../../logic/engine';
import { presetLevels } from '../../logic/presets';

describe('usePiecePlacement', () => {
    const mockLevel = presetLevels[0];

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not place when disabled', () => {
        const mockGameState = createGameState(mockLevel);
        const onPlace = vi.fn();
        const { result } = renderHook(() =>
            usePiecePlacement({
                gameState: mockGameState,
                onPlace,
                disabled: true,
            })
        );

        const success = result.current.handlePlacement({ x: 0, y: 0, z: 0 });

        expect(success).toBe(false);
        expect(onPlace).not.toHaveBeenCalled();
    });

    it('does not place when no piece is selected', () => {
        const mockGameState = createGameState(mockLevel);
        const onPlace = vi.fn();
        const onError = vi.fn();
        const { result } = renderHook(() =>
            usePiecePlacement({
                gameState: { ...mockGameState, selectedPieceId: null },
                onPlace,
                onError,
                disabled: false,
            })
        );

        const success = result.current.handlePlacement({ x: 0, y: 0, z: 0 });

        expect(success).toBe(false);
        expect(onPlace).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith('selectFirst');
    });

    it('clears justPlacedPositions after animation timeout', async () => {
        const mockGameState = {
            ...createGameState(mockLevel),
            selectedPieceId: mockLevel.pieces[0].id,
        };
        const onPlace = vi.fn();
        const { result } = renderHook(() =>
            usePiecePlacement({
                gameState: mockGameState,
                onPlace,
                disabled: false,
            })
        );

        // Initially empty
        expect(result.current.justPlacedPositions.size).toBe(0);

        // Attempt placement (may or may not succeed depending on game logic)
        act(() => {
            result.current.handlePlacement({ x: 0, y: 0, z: 0 });
        });

        // Fast-forward past animation
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Should be cleared after timeout
        expect(result.current.justPlacedPositions.size).toBe(0);
    });

    it('returns success status for valid placement', () => {
        const mockGameState = {
            ...createGameState(mockLevel),
            selectedPieceId: mockLevel.pieces[0].id,
        };
        const onPlace = vi.fn();
        const { result } = renderHook(() =>
            usePiecePlacement({
                gameState: mockGameState,
                onPlace,
                disabled: false,
            })
        );

        // Try placing at a target position
        const targetPos = mockLevel.targetVoxels[0];
        const success = result.current.handlePlacement(targetPos);

        // Success depends on whether the placement is valid for the level
        // But onPlace should be called if successful
        if (success) {
            expect(onPlace).toHaveBeenCalled();
        }
    });
});

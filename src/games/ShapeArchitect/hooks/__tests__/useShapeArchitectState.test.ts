import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShapeArchitectState } from '../useShapeArchitectState';
import { presetLevels } from '../../logic/presets';

describe('useShapeArchitectState', () => {
    it('initializes with random level of selected difficulty', () => {
        const { result } = renderHook(() => useShapeArchitectState());
        // Cohesive shape levels have IDs starting with 'cohesive_'
        expect(result.current.gameState.level.id).toMatch(/^cohesive_/);
        expect(result.current.gameState.level.difficulty).toBe('easy');
        expect(result.current.gameState.isSolved).toBe(false);
        // Easy difficulty should have 3-4 pieces
        expect(result.current.gameState.level.pieces.length).toBeGreaterThanOrEqual(3);
        expect(result.current.gameState.level.pieces.length).toBeLessThanOrEqual(4);
    });

    it('auto-selects first piece on level load', () => {
        const { result } = renderHook(() => useShapeArchitectState());
        expect(result.current.gameState.selectedPieceId).toBe(
            result.current.gameState.remainingPieces[0]?.id ?? null
        );
    });

    it('resets rotation when selecting different piece', () => {
        const { result } = renderHook(() => useShapeArchitectState());
        act(() => { result.current.handleRotateAxis('z'); });
        expect(result.current.gameState.rotation.z).toBe(90);

        const secondPieceId = result.current.gameState.remainingPieces[1]?.id;
        if (secondPieceId) {
            act(() => { result.current.handleSelectPiece(secondPieceId); });
            expect(result.current.gameState.rotation).toEqual({ x: 0, y: 0, z: 0 });
        }
    });

    it('loads level and resets state', () => {
        const { result } = renderHook(() => useShapeArchitectState());
        const easyLevels = presetLevels.filter(l => l.difficulty === 'easy');

        if (easyLevels.length > 1) {
            act(() => {
                result.current.loadLevel(1);
            });
            expect(result.current.currentLevelIndex).toBe(1);
            expect(result.current.gameState.placedPieces).toHaveLength(0);
        }
    });

    it('changes difficulty and generates new random level', () => {
        const { result } = renderHook(() => useShapeArchitectState());
        const initialLevelId = result.current.gameState.level.id;

        act(() => {
            result.current.setDifficulty('medium');
        });

        expect(result.current.difficulty).toBe('medium');
        // Cohesive shape level ID should start with 'cohesive_'
        expect(result.current.gameState.level.id).toMatch(/^cohesive_/);
        // Level ID should have changed
        expect(result.current.gameState.level.id).not.toBe(initialLevelId);
        // Medium difficulty should have 5-6 pieces
        expect(result.current.gameState.level.pieces.length).toBeGreaterThanOrEqual(5);
        expect(result.current.gameState.level.pieces.length).toBeLessThanOrEqual(6);
    });

    it('toggles preview lock', () => {
        const { result } = renderHook(() => useShapeArchitectState());

        expect(result.current.previewLocked).toBe(false);

        // Set hover position first
        act(() => {
            result.current.setHoverPosition({ x: 1, y: 1, z: 0 });
        });

        // Toggle lock
        act(() => {
            result.current.togglePreviewLock();
        });

        expect(result.current.previewLocked).toBe(true);
        expect(result.current.lockedPosition).toEqual({ x: 1, y: 1, z: 0 });
    });

    it('provides effective preview position based on lock state', () => {
        const { result } = renderHook(() => useShapeArchitectState());

        // Set hover position
        act(() => {
            result.current.setHoverPosition({ x: 2, y: 2, z: 0 });
        });

        expect(result.current.effectivePreviewPosition).toEqual({ x: 2, y: 2, z: 0 });

        // Lock preview
        act(() => {
            result.current.togglePreviewLock();
        });

        // Change hover position - effective should stay at locked
        act(() => {
            result.current.setHoverPosition({ x: 3, y: 3, z: 0 });
        });

        expect(result.current.effectivePreviewPosition).toEqual({ x: 2, y: 2, z: 0 });
    });
});

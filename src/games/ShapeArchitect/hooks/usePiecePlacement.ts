import { useState, useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { GameState, Position3D, Piece, Rotation3D } from '../logic/types';
import { DEFAULT_ROTATION } from '../logic/types';
import {
    tryPlacePiece,
    placePiece,
    checkSolved,
    findNearestValidPosition,
    getPieceWorldPositions
} from '../logic/engine';

export interface UsePiecePlacementOptions {
    gameState: GameState;
    onPlace: (newState: GameState, placedPositions: Set<string>) => void;
    onError?: (errorKey: string) => void;
    disabled?: boolean;
}

export interface UsePiecePlacementReturn {
    handlePlacement: (position: Position3D) => boolean;
    handleDragEnd: (event: DragEndEvent) => boolean;
    justPlacedPositions: Set<string>;
}

const ANIMATION_DURATION = 400;

export function usePiecePlacement({
    gameState,
    onPlace,
    onError,
    disabled = false,
}: UsePiecePlacementOptions): UsePiecePlacementReturn {
    const [justPlacedPositions, setJustPlacedPositions] = useState<Set<string>>(new Set());

    // Trigger snap animation for placed cells
    const triggerSnapAnimation = useCallback((positions: Position3D[]) => {
        const posSet = new Set(positions.map(p => `${p.x},${p.y},${p.z}`));
        setJustPlacedPositions(posSet);
        setTimeout(() => setJustPlacedPositions(new Set()), ANIMATION_DURATION);
        return posSet;
    }, []);

    // Handle click placement
    const handlePlacement = useCallback((position: Position3D): boolean => {
        if (disabled) {
            return false;
        }

        if (!gameState.selectedPieceId) {
            onError?.('selectFirst');
            return false;
        }

        const newState = tryPlacePiece(gameState, position);
        if (newState) {
            // Calculate placed positions for animation
            const piece = gameState.remainingPieces.find(p => p.id === gameState.selectedPieceId);
            if (piece) {
                const snappedPos = findNearestValidPosition(
                    gameState.grid, piece, position, gameState.rotation, gameState.level.gridSize, 2
                );
                if (snappedPos) {
                    const positions = getPieceWorldPositions(piece, snappedPos, gameState.rotation);
                    const posSet = triggerSnapAnimation(positions);
                    onPlace(newState, posSet);
                    return true;
                }
            }
            onPlace(newState, new Set());
            return true;
        }

        onError?.('cannotPlace');
        return false;
    }, [gameState, disabled, onPlace, onError, triggerSnapAnimation]);

    // Handle drag-and-drop placement
    const handleDragEnd = useCallback((event: DragEndEvent): boolean => {
        if (disabled) return false;

        const { active, over } = event;
        if (!over) return false;

        // Extract position from droppable id
        const overId = over.id as string;
        if (!overId.startsWith('cell-')) return false;

        const position = over.data.current?.position as Position3D | undefined;
        if (!position) return false;

        // Get the dragged piece
        const piece = active.data.current?.piece as Piece | undefined;
        const dragRotation = active.data.current?.rotation as Rotation3D | undefined;
        const rotation: Rotation3D = dragRotation ?? gameState.rotation;
        if (!piece) return false;

        // Check if placement is valid, using snap-to-nearest
        const finalPosition = findNearestValidPosition(
            gameState.grid,
            piece,
            position,
            rotation,
            gameState.level.gridSize,
            2
        );

        if (!finalPosition) {
            onError?.('cannotPlace');
            return false;
        }

        // Place the piece at snapped position
        const newGrid = placePiece(gameState.grid, piece, finalPosition, rotation);
        const newRemaining = gameState.remainingPieces.filter((p) => p.id !== piece.id);
        const isSolved = checkSolved(newGrid, gameState.level.targetVoxels);

        // Trigger snap animation
        const positions = getPieceWorldPositions(piece, finalPosition, rotation);
        const posSet = triggerSnapAnimation(positions);

        const newState: GameState = {
            ...gameState,
            grid: newGrid,
            placedPieces: [
                ...gameState.placedPieces,
                { pieceId: piece.id, position: finalPosition, rotation: { ...rotation }, color: piece.color },
            ],
            remainingPieces: newRemaining,
            selectedPieceId: null,
            rotation: { ...DEFAULT_ROTATION },
            isSolved,
        };

        onPlace(newState, posSet);
        return true;
    }, [gameState, disabled, onPlace, onError, triggerSnapAnimation]);

    return {
        handlePlacement,
        handleDragEnd,
        justPlacedPositions,
    };
}

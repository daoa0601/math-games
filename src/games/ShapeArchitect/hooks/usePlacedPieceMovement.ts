import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { GameState, Position3D, Rotation3D } from '../logic/types';
import {
    movePlacedPiece,
    findNearestValidPosition,
    getPieceWorldPositions,
    createGridWithoutPiece,
} from '../logic/engine';

export interface UsePlacedPieceMovementOptions {
    gameState: GameState;
    onMove: (newState: GameState, movedPositions: Set<string>) => void;
    onError?: (errorKey: string) => void;
    disabled?: boolean;
}

export interface UsePlacedPieceMovementReturn {
    /** Currently selected placed piece ID (in move mode) */
    selectedPlacedPieceId: string | null;
    /** Select a placed piece for movement */
    selectPlacedPiece: (pieceId: string) => void;
    /** Clear selection and return to idle mode */
    clearSelection: () => void;
    /** Handle tap-to-move (click on a cell to move selected piece there) */
    handleMoveToPosition: (position: Position3D) => boolean;
    /** Handle drag-and-drop movement */
    handleDragEnd: (event: DragEndEvent) => boolean;
    /** Preview position for the piece being moved */
    previewPosition: Position3D | null;
    /** Set hover position for movement preview */
    setPreviewPosition: (position: Position3D | null) => void;
    /** Whether the current preview position is valid */
    isPreviewValid: boolean;
    /** Positions that were just moved (for animation) */
    justMovedPositions: Set<string>;
    /** Current rotation for the piece being moved */
    moveRotation: Rotation3D;
    /** Rotate the piece being moved */
    rotateMoveAxis: (axis: 'x' | 'y' | 'z') => void;
}

const ANIMATION_DURATION = 400;

export function usePlacedPieceMovement({
    gameState,
    onMove,
    onError,
    disabled = false,
}: UsePlacedPieceMovementOptions): UsePlacedPieceMovementReturn {
    const [selectedPlacedPieceId, setSelectedPlacedPieceId] = useState<string | null>(null);
    const [previewPosition, setPreviewPosition] = useState<Position3D | null>(null);
    const [justMovedPositions, setJustMovedPositions] = useState<Set<string>>(new Set());
    const [moveRotation, setMoveRotation] = useState<Rotation3D>({ x: 0, y: 0, z: 0 });

    // Ref to track animation timeout for cleanup
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup animation timeout on unmount
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

    // Check if the selected piece still exists in the game state
    // This handles cases where the piece was removed by undo or level reset
    const selectedPieceStillExists = useMemo(() => {
        if (!selectedPlacedPieceId) return true; // No selection, no problem
        return gameState.placedPieces.some((pp) => pp.pieceId === selectedPlacedPieceId);
    }, [gameState.placedPieces, selectedPlacedPieceId]);

    // Clear selection if the selected piece no longer exists
    useEffect(() => {
        if (!selectedPieceStillExists && selectedPlacedPieceId !== null) {
            // Use queueMicrotask to avoid sync setState in effect warning
            queueMicrotask(() => {
                setSelectedPlacedPieceId(null);
                setPreviewPosition(null);
                setMoveRotation({ x: 0, y: 0, z: 0 });
            });
        }
    }, [selectedPieceStillExists, selectedPlacedPieceId]);

    // Get the currently selected placed piece
    const selectedPlacedPiece = useMemo(() => {
        if (!selectedPlacedPieceId) return null;
        return gameState.placedPieces.find((pp) => pp.pieceId === selectedPlacedPieceId) ?? null;
    }, [gameState.placedPieces, selectedPlacedPieceId]);

    // Get the piece definition for the selected placed piece
    const selectedPieceDefinition = useMemo(() => {
        if (!selectedPlacedPieceId) return null;
        return gameState.level.pieces.find((p) => p.id === selectedPlacedPieceId) ?? null;
    }, [gameState.level.pieces, selectedPlacedPieceId]);

    // Memoize snap-to-nearest calculation to avoid expensive grid traversal on every hover
    const snappedPreviewPosition = useMemo(() => {
        if (!selectedPlacedPieceId || !previewPosition || !selectedPieceDefinition || !selectedPlacedPiece) {
            return null;
        }

        const gridWithoutPiece = createGridWithoutPiece(
            gameState.grid,
            selectedPieceDefinition,
            selectedPlacedPiece,
            gameState.level.targetVoxels
        );

        return findNearestValidPosition(
            gridWithoutPiece,
            selectedPieceDefinition,
            previewPosition,
            moveRotation,
            gameState.level.gridSize,
            2 // search radius
        );
    }, [
        selectedPlacedPieceId,
        previewPosition,
        moveRotation,
        gameState.grid,
        gameState.level.gridSize,
        gameState.level.targetVoxels,
        selectedPieceDefinition,
        selectedPlacedPiece,
    ]);

    // Check if preview position is valid (uses memoized snap result)
    const isPreviewValid = useMemo(() => {
        if (!selectedPlacedPieceId || !previewPosition) return false;
        // If we have a snapped position, the preview is valid
        return snappedPreviewPosition !== null;
    }, [selectedPlacedPieceId, previewPosition, snappedPreviewPosition]);

    // Trigger animation for moved cells
    const triggerMoveAnimation = useCallback((positions: Position3D[]) => {
        const posSet = new Set(positions.map((p) => `${p.x},${p.y},${p.z}`));
        setJustMovedPositions(posSet);
        // Clear any existing timeout before setting a new one
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => setJustMovedPositions(new Set()), ANIMATION_DURATION);
        return posSet;
    }, []);

    // Select a placed piece for movement
    const selectPlacedPiece = useCallback((pieceId: string) => {
        if (disabled) return;

        const placedPiece = gameState.placedPieces.find((pp) => pp.pieceId === pieceId);
        if (!placedPiece) {
            onError?.('pieceNotFound');
            return;
        }

        setSelectedPlacedPieceId(pieceId);
        // Initialize rotation to the piece's current rotation
        setMoveRotation(placedPiece.rotation);
        setPreviewPosition(null);
    }, [gameState.placedPieces, disabled, onError]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedPlacedPieceId(null);
        setPreviewPosition(null);
        setMoveRotation({ x: 0, y: 0, z: 0 });
    }, []);

    // Rotate the piece being moved
    const rotateMoveAxis = useCallback((axis: 'x' | 'y' | 'z') => {
        setMoveRotation((prev) => ({
            ...prev,
            [axis]: (prev[axis] + 90) % 360,
        }));
    }, []);

    // Handle tap-to-move
    const handleMoveToPosition = useCallback((position: Position3D): boolean => {
        if (disabled || !selectedPlacedPieceId) return false;

        const piece = selectedPieceDefinition;
        const placedPiece = selectedPlacedPiece;
        if (!piece || !placedPiece) return false;

        // Use memoized snap result if position matches current preview (common case)
        // This avoids expensive grid traversal when clicking on the previewed position
        const isPreviewClick = previewPosition &&
            position.x === previewPosition.x &&
            position.y === previewPosition.y &&
            position.z === previewPosition.z;

        let snappedPosition: Position3D | null;

        if (isPreviewClick && snappedPreviewPosition) {
            // Fast path: use memoized result
            snappedPosition = snappedPreviewPosition;
        } else {
            // Slow path: compute fresh (for clicks not on preview position)
            const gridWithoutPiece = createGridWithoutPiece(
                gameState.grid,
                piece,
                placedPiece,
                gameState.level.targetVoxels
            );

            snappedPosition = findNearestValidPosition(
                gridWithoutPiece,
                piece,
                position,
                moveRotation,
                gameState.level.gridSize,
                2
            );
        }

        if (!snappedPosition) {
            onError?.('cannotMove');
            return false;
        }

        // Perform the move
        const newState = movePlacedPiece(
            gameState,
            selectedPlacedPieceId,
            snappedPosition,
            moveRotation
        );

        if (newState) {
            // Calculate moved positions for animation
            const positions = getPieceWorldPositions(piece, snappedPosition, moveRotation);
            const posSet = triggerMoveAnimation(positions);
            onMove(newState, posSet);
            clearSelection();
            return true;
        }

        onError?.('cannotMove');
        return false;
    }, [
        disabled,
        selectedPlacedPieceId,
        selectedPieceDefinition,
        selectedPlacedPiece,
        gameState,
        moveRotation,
        previewPosition,
        snappedPreviewPosition,
        onMove,
        onError,
        clearSelection,
        triggerMoveAnimation,
    ]);

    // Handle drag-and-drop movement
    const handleDragEnd = useCallback((event: DragEndEvent): boolean => {
        if (disabled || !selectedPlacedPieceId) return false;

        const { over } = event;
        if (!over?.data?.current?.position) return false;

        const dropPosition = over.data.current.position as Position3D;
        return handleMoveToPosition(dropPosition);
    }, [disabled, selectedPlacedPieceId, handleMoveToPosition]);

    return {
        selectedPlacedPieceId,
        selectPlacedPiece,
        clearSelection,
        handleMoveToPosition,
        handleDragEnd,
        previewPosition,
        setPreviewPosition,
        isPreviewValid,
        justMovedPositions,
        moveRotation,
        rotateMoveAxis,
    };
}

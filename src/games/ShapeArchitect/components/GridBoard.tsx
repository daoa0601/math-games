import { useMemo, memo, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CellState, Piece, Position3D, PlacedPiece } from '../logic/types';
import { getPieceWorldPositions, findNearestValidPosition } from '../logic/engine';

interface DroppableCellProps {
    position: Position3D;
    cellClass: string;
    bgColor?: string;
    canPlace: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    isTarget: boolean;
    ariaLabel: string;
}

function DroppableCell({
    position,
    cellClass,
    bgColor,
    canPlace,
    onClick,
    onMouseEnter,
    isTarget,
    ariaLabel,
}: DroppableCellProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `cell-${position.x}-${position.y}-${position.z}`,
        data: { position },
        disabled: !isTarget,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${cellClass} ${isOver ? 'grid-cell--drag-over' : ''}`}
            style={{
                backgroundColor: bgColor,
                cursor: canPlace ? 'pointer' : undefined,
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            role="gridcell"
            aria-label={ariaLabel}
            tabIndex={isTarget && canPlace ? 0 : -1}
            onKeyDown={(e) => {
                if (isTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
        />
    );
}

interface GridBoardProps {
    grid: CellState[][][];
    gridSize: [number, number, number];
    selectedPiece: Piece | null;
    rotation: number;
    placedPieces: PlacedPiece[];
    levelPieces: Piece[];
    onCellClick: (position: Position3D) => void;
    hoverPosition?: Position3D | null;
    onCellHover?: (position: Position3D | null) => void;
}

export const GridBoard = memo(function GridBoard({
    grid,
    gridSize,
    selectedPiece,
    rotation,
    placedPieces,
    levelPieces,
    onCellClick,
    hoverPosition,
    onCellHover,
}: GridBoardProps) {
    const [width, height] = gridSize;

    // Build a map of cell positions to colors based on placed pieces
    const cellColorMap = useMemo(() => {
        const colorMap = new Map<string, string>();
        for (const placed of placedPieces) {
            const piece = levelPieces.find(p => p.id === placed.pieceId);
            if (!piece) continue;
            const positions = getPieceWorldPositions(piece, placed.position, placed.rotation);
            for (const pos of positions) {
                colorMap.set(`${pos.x},${pos.y},${pos.z}`, placed.color);
            }
        }
        return colorMap;
    }, [placedPieces, levelPieces]);

    // Calculate preview positions based on hover, using snap-to-nearest
    const previewData = useMemo(() => {
        if (!selectedPiece || !hoverPosition) {
            return { positions: new Set<string>(), isValid: false, snappedPosition: null };
        }

        // Try to find a valid position using snap-to-nearest
        const snappedPosition = findNearestValidPosition(
            grid,
            selectedPiece,
            hoverPosition,
            rotation,
            gridSize,
            2
        );

        const finalPosition = snappedPosition ?? hoverPosition;
        const worldPositions = getPieceWorldPositions(selectedPiece, finalPosition, rotation);
        const positionSet = new Set<string>();

        for (const pos of worldPositions) {
            positionSet.add(`${pos.x},${pos.y},${pos.z}`);
        }

        return {
            positions: positionSet,
            isValid: snappedPosition !== null,
            snappedPosition,
        };
    }, [selectedPiece, hoverPosition, rotation, gridSize, grid]);

    const handleMouseEnter = useCallback((position: Position3D) => {
        onCellHover?.(position);
    }, [onCellHover]);

    const handleMouseLeave = useCallback(() => {
        onCellHover?.(null);
    }, [onCellHover]);

    // Generate aria-label for a cell based on its state
    const getCellAriaLabel = (cell: CellState, x: number, y: number, canPlaceHere: boolean): string => {
        const position = `Row ${y + 1}, Column ${x + 1}`;
        if (cell === 0) {
            return `${position}: Empty cell, not part of target shape`;
        }
        if (cell === 2) {
            return `${position}: Filled with a piece`;
        }
        // cell === 1 (target)
        if (canPlaceHere) {
            return `${position}: Target cell, can place selected piece here. Press Enter or click to place.`;
        }
        return `${position}: Target cell, needs to be filled`;
    };

    return (
        <div
            className="grid-board"
            onMouseLeave={handleMouseLeave}
            role="grid"
            aria-label={`Shape puzzle grid, ${width} columns by ${height} rows. Fill all target cells with pieces.`}
        >
            {Array(height)
                .fill(null)
                .map((_, y) => (
                    <div key={y} className="grid-row" role="row">
                        {Array(width)
                            .fill(null)
                            .map((_, x) => {
                                const cellY = height - 1 - y; // Flip Y for visual
                                const cell = grid[x][cellY][0];
                                const position: Position3D = { x, y: cellY, z: 0 };
                                const posKey = `${x},${cellY},0`;

                                let cellClass = 'grid-cell';
                                let bgColor = undefined;

                                if (cell === 0) {
                                    cellClass += ' grid-cell--empty';
                                } else if (cell === 1) {
                                    cellClass += ' grid-cell--target';
                                } else if (cell === 2) {
                                    cellClass += ' grid-cell--filled';
                                    // Get the actual color from the placed piece
                                    bgColor = cellColorMap.get(posKey) ?? 'var(--color-primary)';
                                }

                                // Add preview styling
                                if (previewData.positions.has(posKey)) {
                                    cellClass += previewData.isValid
                                        ? ' grid-cell--preview-valid'
                                        : ' grid-cell--preview-invalid';
                                }

                                // Check if clicking here could place a piece (using snap-to-nearest)
                                const canPlaceHere = !!(selectedPiece && cell === 1 &&
                                    findNearestValidPosition(grid, selectedPiece, position, rotation, gridSize, 2));

                                return (
                                    <DroppableCell
                                        key={`${x}-${y}`}
                                        position={position}
                                        cellClass={cellClass}
                                        bgColor={cell === 2 ? bgColor : undefined}
                                        canPlace={canPlaceHere}
                                        onClick={() => cell === 1 && onCellClick(position)}
                                        onMouseEnter={() => cell === 1 && handleMouseEnter(position)}
                                        isTarget={cell === 1}
                                        ariaLabel={getCellAriaLabel(cell, x, cellY, canPlaceHere)}
                                    />
                                );
                            })}
                    </div>
                ))}
        </div>
    );
});

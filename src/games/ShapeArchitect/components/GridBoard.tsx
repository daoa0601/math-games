import { useMemo, memo, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CellState, Piece, Position3D, PlacedPiece, Rotation3D } from '../logic/types';
import { getPieceWorldPositions, findNearestValidPosition } from '../logic/engine';
import { getExplicitPattern, type PatternClass } from '@/shared/utils';

interface DroppableCellProps {
    position: Position3D;
    cellClass: string;
    bgColor?: string;
    canPlace: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    isTarget: boolean;
    ariaLabel: string;
    tabIndex: number;
    dataCellAttr: string;
}

function DroppableCell({
    position,
    cellClass,
    bgColor,
    canPlace,
    onClick,
    onMouseEnter,
    onKeyDown,
    isTarget,
    ariaLabel,
    tabIndex,
    dataCellAttr,
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
            onKeyDown={onKeyDown}
            role="gridcell"
            aria-label={ariaLabel}
            tabIndex={tabIndex}
            data-cell={dataCellAttr}
        />
    );
}

interface GridBoardProps {
    grid: CellState[][][];
    gridSize: [number, number, number];
    selectedPiece: Piece | null;
    rotation: Rotation3D;
    placedPieces: PlacedPiece[];
    levelPieces: Piece[];
    onCellClick: (position: Position3D) => void;
    hoverPosition?: Position3D | null;
    onCellHover?: (position: Position3D | null) => void;
    justPlacedPositions?: Set<string>; // Positions that were just placed (for snap animation)
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
    justPlacedPositions,
}: GridBoardProps) {
    const [width, height] = gridSize;

    // Build a map of cell positions to colors and patterns based on placed pieces
    const cellColorMap = useMemo(() => {
        const colorMap = new Map<string, { color: string; pattern: PatternClass }>();
        for (const placed of placedPieces) {
            const piece = levelPieces.find(p => p.id === placed.pieceId);
            if (!piece) continue;
            const positions = getPieceWorldPositions(piece, placed.position, placed.rotation);
            const pattern = getExplicitPattern(placed.color);
            for (const pos of positions) {
                colorMap.set(`${pos.x},${pos.y},${pos.z}`, {
                    color: placed.color,
                    pattern
                });
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

    // Keyboard navigation handler for grid cells (roving tabindex pattern)
    const handleGridKeyDown = useCallback((e: React.KeyboardEvent, x: number, visualY: number, cell: CellState) => {
        const isNavigationKey = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key);
        const isActionKey = e.key === 'Enter' || e.key === ' ';

        if (!isNavigationKey && !isActionKey) return;

        e.preventDefault();

        // Handle action keys (place piece)
        if (isActionKey) {
            const cellY = height - 1 - visualY; // Convert visual Y to grid Y
            if (cell === 1) {
                onCellClick({ x, y: cellY, z: 0 });
            }
            return;
        }

        // Handle navigation keys
        let nextX = x;
        let nextVisualY = visualY;

        switch (e.key) {
            case 'ArrowRight':
                nextX = Math.min(x + 1, width - 1);
                break;
            case 'ArrowLeft':
                nextX = Math.max(x - 1, 0);
                break;
            case 'ArrowDown':
                nextVisualY = Math.min(visualY + 1, height - 1);
                break;
            case 'ArrowUp':
                nextVisualY = Math.max(visualY - 1, 0);
                break;
        }

        if (nextX !== x || nextVisualY !== visualY) {
            const nextCell = document.querySelector(`[data-cell="${nextX}-${nextVisualY}"]`) as HTMLElement;
            nextCell?.focus();
        }
    }, [width, height, onCellClick]);

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
                                    // Get the actual color and pattern from the placed piece
                                    const cellData = cellColorMap.get(posKey);
                                    bgColor = cellData?.color ?? 'var(--color-primary)';
                                    // Apply pattern class for accessibility
                                    if (cellData?.pattern) {
                                        cellClass += ` ${cellData.pattern}`;
                                    }
                                    // Add snap animation for just-placed cells
                                    if (justPlacedPositions?.has(posKey)) {
                                        cellClass += ' grid-cell--just-placed grid-cell--dust-effect';
                                    }
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

                                // Roving tabindex: only first cell is tabbable, rest use -1
                                const cellTabIndex = (x === 0 && y === 0) ? 0 : -1;

                                return (
                                    <DroppableCell
                                        key={`${x}-${y}`}
                                        position={position}
                                        cellClass={cellClass}
                                        bgColor={cell === 2 ? bgColor : undefined}
                                        canPlace={canPlaceHere}
                                        onClick={() => cell === 1 && onCellClick(position)}
                                        onMouseEnter={() => cell === 1 && handleMouseEnter(position)}
                                        onKeyDown={(e) => handleGridKeyDown(e, x, y, cell)}
                                        isTarget={cell === 1}
                                        ariaLabel={getCellAriaLabel(cell, x, cellY, canPlaceHere)}
                                        tabIndex={cellTabIndex}
                                        dataCellAttr={`${x}-${y}`}
                                    />
                                );
                            })}
                    </div>
                ))}
        </div>
    );
});

import { useMemo, memo, useCallback, type CSSProperties } from 'react';
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

const DroppableCell = memo(function DroppableCell({
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

    const style = useMemo((): CSSProperties | undefined => {
        if (!bgColor && !canPlace) return undefined;
        return {
            backgroundColor: bgColor,
            cursor: canPlace ? 'pointer' : undefined,
        };
    }, [bgColor, canPlace]);

    return (
        <div
            ref={setNodeRef}
            className={`${cellClass} ${isOver ? 'sa-cell--drag-over' : ''}`}
            style={style}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onKeyDown={onKeyDown}
            role="gridcell"
            aria-label={ariaLabel}
            tabIndex={tabIndex}
            data-cell={dataCellAttr}
        />
    );
});

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
    isPreviewLocked?: boolean; // Whether the preview position is locked
    /** ID of placed piece currently selected for movement */
    selectedPlacedPieceId?: string | null;
    /** Callback when a placed piece is clicked (for movement selection) */
    onPlacedPieceClick?: (pieceId: string) => void;
    /** Whether movement preview is valid */
    isMovePreviewValid?: boolean;
    /** Rotation for the piece being moved */
    moveRotation?: Rotation3D;
}

/**
 * Custom comparison for GridBoard memo to ensure proper updates.
 * Uses reference equality for complex objects (which are replaced on state changes)
 * and value equality for rotation (small object that may be recreated).
 */
function arePropsEqual(prevProps: GridBoardProps, nextProps: GridBoardProps): boolean {
    // Reference equality for arrays/objects that are replaced on state change
    if (prevProps.grid !== nextProps.grid) return false;
    if (prevProps.placedPieces !== nextProps.placedPieces) return false;
    if (prevProps.levelPieces !== nextProps.levelPieces) return false;
    if (prevProps.justPlacedPositions !== nextProps.justPlacedPositions) return false;

    // Reference equality for selected piece (null-safe)
    if (prevProps.selectedPiece !== nextProps.selectedPiece) return false;

    // Deep equality for rotation (small object, may be recreated with same values)
    if (prevProps.rotation.x !== nextProps.rotation.x ||
        prevProps.rotation.y !== nextProps.rotation.y ||
        prevProps.rotation.z !== nextProps.rotation.z) return false;

    // Tuple equality for gridSize
    if (prevProps.gridSize[0] !== nextProps.gridSize[0] ||
        prevProps.gridSize[1] !== nextProps.gridSize[1] ||
        prevProps.gridSize[2] !== nextProps.gridSize[2]) return false;

    // Deep equality for hoverPosition (null-safe)
    if (prevProps.hoverPosition === null && nextProps.hoverPosition !== null) return false;
    if (prevProps.hoverPosition !== null && nextProps.hoverPosition === null) return false;
    if (prevProps.hoverPosition && nextProps.hoverPosition) {
        if (prevProps.hoverPosition.x !== nextProps.hoverPosition.x ||
            prevProps.hoverPosition.y !== nextProps.hoverPosition.y ||
            prevProps.hoverPosition.z !== nextProps.hoverPosition.z) return false;
    }

    // Primitive equality
    if (prevProps.isPreviewLocked !== nextProps.isPreviewLocked) return false;
    if (prevProps.selectedPlacedPieceId !== nextProps.selectedPlacedPieceId) return false;
    if (prevProps.isMovePreviewValid !== nextProps.isMovePreviewValid) return false;

    // Deep equality for moveRotation (null-safe)
    if (prevProps.moveRotation && nextProps.moveRotation) {
        if (prevProps.moveRotation.x !== nextProps.moveRotation.x ||
            prevProps.moveRotation.y !== nextProps.moveRotation.y ||
            prevProps.moveRotation.z !== nextProps.moveRotation.z) return false;
    } else if (prevProps.moveRotation !== nextProps.moveRotation) {
        return false;
    }

    // Callbacks - reference equality (should be stable via useCallback upstream)
    if (prevProps.onCellClick !== nextProps.onCellClick) return false;
    if (prevProps.onCellHover !== nextProps.onCellHover) return false;
    if (prevProps.onPlacedPieceClick !== nextProps.onPlacedPieceClick) return false;

    return true;
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
    isPreviewLocked = false,
    selectedPlacedPieceId,
    onPlacedPieceClick,
    isMovePreviewValid: _isMovePreviewValid = false,
    moveRotation: _moveRotation,
}: GridBoardProps) {
    // Future use: movement preview rendering
    void _isMovePreviewValid;
    void _moveRotation;
    const [width, height] = gridSize;

    // Build a map of cell positions to colors, patterns, and piece IDs based on placed pieces
    const cellColorMap = useMemo(() => {
        const colorMap = new Map<string, { color: string; pattern: PatternClass; pieceId: string }>();
        for (const placed of placedPieces) {
            const piece = levelPieces.find(p => p.id === placed.pieceId);
            if (!piece) continue;
            const positions = getPieceWorldPositions(piece, placed.position, placed.rotation);
            const pattern = getExplicitPattern(placed.color);
            for (const pos of positions) {
                colorMap.set(`${pos.x},${pos.y},${pos.z}`, {
                    color: placed.color,
                    pattern,
                    pieceId: placed.pieceId,
                });
            }
        }
        return colorMap;
    }, [placedPieces, levelPieces]);

    // Get positions of the currently selected placed piece (for highlighting)
    const selectedPlacedPiecePositions = useMemo(() => {
        if (!selectedPlacedPieceId) return new Set<string>();
        const positions = new Set<string>();
        cellColorMap.forEach((data, posKey) => {
            if (data.pieceId === selectedPlacedPieceId) {
                positions.add(posKey);
            }
        });
        return positions;
    }, [selectedPlacedPieceId, cellColorMap]);

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

    // Parse position keys for ghost overlay rendering
    const ghostCells = useMemo(() => {
        if (!selectedPiece || previewData.positions.size === 0) {
            return [];
        }

        const cells: Array<{ x: number; y: number; z: number; key: string }> = [];
        previewData.positions.forEach((posKey) => {
            const [x, y, z] = posKey.split(',').map(Number);
            cells.push({ x, y, z, key: posKey });
        });
        return cells;
    }, [selectedPiece, previewData.positions]);

    return (
        <div
            className="sa-board"
            onMouseLeave={handleMouseLeave}
            role="grid"
            aria-label={`Shape puzzle grid, ${width} columns by ${height} rows. Fill all target cells with pieces.`}
        >
            {Array(height)
                .fill(null)
                .map((_, y) => (
                    <div key={y} className="sa-row" role="row">
                        {Array(width)
                            .fill(null)
                            .map((_, x) => {
                                const cellY = height - 1 - y; // Flip Y for visual
                                const cell = grid[x][cellY][0];
                                const position: Position3D = { x, y: cellY, z: 0 };
                                const posKey = `${x},${cellY},0`;

                                let cellClass = 'sa-cell';
                                let bgColor = undefined;

                                if (cell === 0) {
                                    cellClass += ' sa-cell--empty';
                                } else if (cell === 1) {
                                    cellClass += ' sa-cell--target';
                                } else if (cell === 2) {
                                    cellClass += ' sa-cell--filled';
                                    // Get the actual color and pattern from the placed piece
                                    const cellData = cellColorMap.get(posKey);
                                    bgColor = cellData?.color ?? 'var(--accent)';
                                    // Apply pattern class for accessibility
                                    if (cellData?.pattern) {
                                        cellClass += ` ${cellData.pattern}`;
                                    }
                                    // Add snap animation for just-placed cells
                                    if (justPlacedPositions?.has(posKey)) {
                                        cellClass += ' sa-cell--just-placed';
                                    }
                                    // Highlight selected placed piece
                                    if (selectedPlacedPiecePositions.has(posKey)) {
                                        cellClass += ' sa-cell--selected-for-move';
                                    }
                                    // Add movable class if pieces can be moved
                                    if (onPlacedPieceClick) {
                                        cellClass += ' sa-cell--movable';
                                    }
                                }

                                // Add preview styling
                                if (previewData.positions.has(posKey)) {
                                    cellClass += previewData.isValid
                                        ? ' sa-cell--preview-valid'
                                        : ' sa-cell--preview-invalid';
                                }

                                // Check if clicking here could place a piece (using snap-to-nearest)
                                const canPlaceHere = !!(selectedPiece && cell === 1 &&
                                    findNearestValidPosition(grid, selectedPiece, position, rotation, gridSize, 2));

                                // Get cell data for filled cells
                                const cellData = cell === 2 ? cellColorMap.get(posKey) : null;

                                // Click handler: handles both placement (target cells) and selection (filled cells)
                                const handleClick = () => {
                                    if (cell === 1) {
                                        // Target cell - place piece or move selected piece here
                                        onCellClick(position);
                                    } else if (cell === 2 && cellData && onPlacedPieceClick) {
                                        // Filled cell - select this piece for movement
                                        onPlacedPieceClick(cellData.pieceId);
                                    }
                                };

                                // Roving tabindex: only first cell is tabbable, rest use -1
                                const cellTabIndex = (x === 0 && y === 0) ? 0 : -1;

                                // Cell is interactive if it's a target or a movable filled cell
                                const isInteractive = cell === 1 || (cell === 2 && !!onPlacedPieceClick);

                                return (
                                    <DroppableCell
                                        key={`${x}-${y}`}
                                        position={position}
                                        cellClass={cellClass}
                                        bgColor={cell === 2 ? bgColor : undefined}
                                        canPlace={canPlaceHere || isInteractive}
                                        onClick={handleClick}
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
            {/* Ghost overlay showing piece shape at hover position */}
            {selectedPiece && ghostCells.length > 0 && (
                <div
                    className="sa-ghost"
                    aria-hidden="true"
                    style={{
                        '--grid-cols': width,
                        '--grid-rows': height,
                    } as React.CSSProperties}
                >
                    {ghostCells.map(({ x, y, key }) => {
                        // Convert grid Y to visual Y (flip for display)
                        const visualY = height - 1 - y;
                        const ghostClass = [
                            'sa-ghost__cell',
                            previewData.isValid ? 'sa-ghost__cell--valid' : 'sa-ghost__cell--invalid',
                            isPreviewLocked ? 'sa-ghost__cell--locked' : '',
                        ].filter(Boolean).join(' ');

                        return (
                            <div
                                key={key}
                                className={ghostClass}
                                style={{
                                    gridColumn: x + 1,
                                    gridRow: visualY + 1,
                                    backgroundColor: selectedPiece.color,
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}, arePropsEqual);

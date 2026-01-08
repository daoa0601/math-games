import { useRef, memo, useMemo, useCallback, type CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Piece, Rotation3D } from '../logic/types';
import { getExplicitPattern } from '@/shared/utils';
import { IsometricPiecePreview } from './IsometricPiecePreview';

interface PieceInventoryProps {
    pieces: Piece[];
    selectedPieceId: string | null;
    onSelectPiece: (pieceId: string) => void;
    rotation: Rotation3D;
}

interface DraggablePieceProps {
    piece: Piece;
    isSelected: boolean;
    onSelect: () => void;
    rotation: Rotation3D;
}

// Minimum distance (in pixels) to consider as a drag vs click
const DRAG_THRESHOLD = 5;

const DraggablePiece = memo(function DraggablePiece({ piece, isSelected, onSelect, rotation }: DraggablePieceProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.id,
        data: { piece, rotation },
    });

    // Track mouse position at start of interaction to distinguish clicks from drags
    const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleClick = useCallback((e: React.MouseEvent) => {
        // Calculate distance moved since mousedown
        const movedDistance = mouseDownPos.current
            ? Math.hypot(
                e.clientX - mouseDownPos.current.x,
                e.clientY - mouseDownPos.current.y
            )
            : 0;

        // Only treat as click if mouse didn't move much (not a drag)
        if (movedDistance < DRAG_THRESHOLD) {
            e.stopPropagation();
            onSelect();
        }
        mouseDownPos.current = null;
    }, [onSelect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onSelect();
    }, [onSelect]);

    // Memoize piece calculations
    const { is3DPiece, previewGrid, patternClass } = useMemo(() => {
        const is3D = piece.layout.some((p) => p.z > 0);
        const maxX = Math.max(...piece.layout.map((p) => p.x)) + 1;
        const maxY = Math.max(...piece.layout.map((p) => p.y)) + 1;

        const grid: boolean[][] = Array(maxY)
            .fill(null)
            .map(() => Array(maxX).fill(false));

        piece.layout.forEach((pos) => {
            grid[pos.y][pos.x] = true;
        });

        return {
            is3DPiece: is3D,
            previewGrid: grid,
            patternClass: getExplicitPattern(piece.color),
        };
    }, [piece.layout, piece.color]);

    const style = useMemo((): CSSProperties | undefined => {
        if (!transform) return undefined;
        return {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: isDragging ? 1000 : undefined,
            opacity: isDragging ? 0.8 : 1,
        };
    }, [transform, isDragging]);

    // Memoize cell style to avoid creating new objects per cell
    const filledCellStyle = useMemo((): CSSProperties => ({
        backgroundColor: piece.color,
    }), [piece.color]);

    return (
        <div
            ref={setNodeRef}
            className={`sa-card ${isSelected ? 'sa-card--selected' : ''} ${isDragging ? 'sa-card--dragging' : ''}`}
            style={style}
            {...attributes}
        >
            {/* Clickable selection area - separate from drag handle */}
            <div
                className="sa-card__clickable"
                onMouseDown={handleMouseDown}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Select ${piece.name} piece`}
            >
                {/* Drag handle - only this area initiates drag */}
                <div className="sa-card__drag-handle" {...listeners}>
                    {is3DPiece ? (
                        <div className="sa-preview" aria-label={`${piece.name} piece`}>
                            <IsometricPiecePreview piece={piece} size={48} />
                        </div>
                    ) : (
                        <div className="sa-preview" aria-label={`${piece.name} piece`}>
                            {[...previewGrid].reverse().map((row, y) => (
                                <div key={y} className="sa-preview__row">
                                    {row.map((filled, x) => (
                                        <div
                                            key={x}
                                            className={`sa-preview__cell ${filled ? patternClass : 'sa-preview__cell--empty'}`}
                                            style={filled ? filledCellStyle : undefined}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <span className="sa-card__name">{piece.name}</span>
            </div>
        </div>
    );
});

export function PieceInventory({ pieces, selectedPieceId, onSelectPiece, rotation }: PieceInventoryProps) {
    // Stable callback factory to avoid creating new functions per piece
    const handleSelectPiece = useCallback((pieceId: string) => {
        onSelectPiece(pieceId);
    }, [onSelectPiece]);

    if (pieces.length === 0) {
        return (
            <div className="sa-inventory">
                <p className="sa-inventory__empty">
                    All pieces placed! 🎉
                </p>
            </div>
        );
    }

    return (
        <div className="sa-inventory">
            {pieces.map((piece) => (
                <DraggablePiece
                    key={piece.id}
                    piece={piece}
                    isSelected={selectedPieceId === piece.id}
                    onSelect={handleSelectPiece.bind(null, piece.id)}
                    rotation={rotation}
                />
            ))}
        </div>
    );
}

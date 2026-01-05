import { useRef } from 'react';
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

function DraggablePiece({ piece, isSelected, onSelect, rotation }: DraggablePieceProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.id,
        data: { piece, rotation },
    });

    // Track mouse position at start of interaction to distinguish clicks from drags
    const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e: React.MouseEvent) => {
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
    };

    // Check if piece has 3D depth (z > 0)
    const is3DPiece = piece.layout.some((p) => p.z > 0);

    // Calculate piece bounds for preview
    const maxX = Math.max(...piece.layout.map((p) => p.x)) + 1;
    const maxY = Math.max(...piece.layout.map((p) => p.y)) + 1;

    // Create preview grid for 2D pieces
    const previewGrid: boolean[][] = Array(maxY)
        .fill(null)
        .map(() => Array(maxX).fill(false));

    piece.layout.forEach((pos) => {
        previewGrid[pos.y][pos.x] = true;
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: isDragging ? 1000 : undefined,
            opacity: isDragging ? 0.8 : 1,
        }
        : undefined;

    // Get pattern class for this piece's color
    const patternClass = getExplicitPattern(piece.color);

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
                onKeyDown={(e) => e.key === 'Enter' && onSelect()}
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
                                            style={{ backgroundColor: filled ? piece.color : undefined }}
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
}

export function PieceInventory({ pieces, selectedPieceId, onSelectPiece, rotation }: PieceInventoryProps) {
    if (pieces.length === 0) {
        return (
            <div className="sa-inventory">
                <p style={{ color: 'var(--muted)', margin: 0 }}>
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
                    onSelect={() => onSelectPiece(piece.id)}
                    rotation={rotation}
                />
            ))}
        </div>
    );
}

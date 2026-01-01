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

function DraggablePiece({ piece, isSelected, onSelect, rotation }: DraggablePieceProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.id,
        data: { piece, rotation },
    });

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
            className={`piece-card ${isSelected ? 'piece-card--selected' : ''} ${isDragging ? 'piece-card--dragging' : ''}`}
            style={style}
            onClick={onSelect}
            {...listeners}
            {...attributes}
        >
            {is3DPiece ? (
                <div className="piece-preview" aria-label={`${piece.name} piece`}>
                    <IsometricPiecePreview piece={piece} size={48} />
                </div>
            ) : (
                <div className="piece-preview" aria-label={`${piece.name} piece`}>
                    {[...previewGrid].reverse().map((row, y) => (
                        <div key={y} className="piece-preview-row">
                            {row.map((filled, x) => (
                                <div
                                    key={x}
                                    className={`piece-preview-cell ${filled ? patternClass : 'piece-preview-cell--empty'}`}
                                    style={{ backgroundColor: filled ? piece.color : undefined }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
            <span className="piece-name">{piece.name}</span>
        </div>
    );
}

export function PieceInventory({ pieces, selectedPieceId, onSelectPiece, rotation }: PieceInventoryProps) {
    if (pieces.length === 0) {
        return (
            <div className="piece-inventory">
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    All pieces placed! 🎉
                </p>
            </div>
        );
    }

    return (
        <div className="piece-inventory">
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

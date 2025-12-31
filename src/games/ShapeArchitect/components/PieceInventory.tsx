import { useDraggable } from '@dnd-kit/core';
import type { Piece } from '../logic/types';

interface PieceInventoryProps {
    pieces: Piece[];
    selectedPieceId: string | null;
    onSelectPiece: (pieceId: string) => void;
    rotation: number;
}

interface DraggablePieceProps {
    piece: Piece;
    isSelected: boolean;
    onSelect: () => void;
    rotation: number;
}

function DraggablePiece({ piece, isSelected, onSelect, rotation }: DraggablePieceProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.id,
        data: { piece, rotation },
    });

    // Calculate piece bounds for preview
    const maxX = Math.max(...piece.layout.map((p) => p.x)) + 1;
    const maxY = Math.max(...piece.layout.map((p) => p.y)) + 1;

    // Create preview grid
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

    return (
        <div
            ref={setNodeRef}
            className={`piece-card ${isSelected ? 'piece-card--selected' : ''} ${isDragging ? 'piece-card--dragging' : ''}`}
            style={style}
            onClick={onSelect}
            {...listeners}
            {...attributes}
        >
            <div className="piece-preview">
                {[...previewGrid].reverse().map((row, y) => (
                    <div key={y} className="piece-preview-row">
                        {row.map((filled, x) => (
                            <div
                                key={x}
                                className={`piece-preview-cell ${filled ? '' : 'piece-preview-cell--empty'}`}
                                style={{ backgroundColor: filled ? piece.color : undefined }}
                            />
                        ))}
                    </div>
                ))}
            </div>
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

import type { Piece } from '../logic/types';

interface IsometricPiecePreviewProps {
    piece: Piece;
    size?: number;
}

export function IsometricPiecePreview({ piece, size = 40 }: IsometricPiecePreviewProps) {
    // Calculate bounds
    const maxX = Math.max(...piece.layout.map((p) => p.x)) + 1;
    const maxY = Math.max(...piece.layout.map((p) => p.y)) + 1;
    const maxZ = Math.max(...piece.layout.map((p) => p.z)) + 1;

    const cellSize = size / Math.max(maxX, maxY, maxZ);

    // Sort by z, y, x for proper rendering order (back to front)
    const sortedLayout = [...piece.layout].sort((a, b) => {
        if (a.z !== b.z) return a.z - b.z;
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });

    return (
        <div className="sa-isometric-preview" style={{ width: size, height: size }}>
            {sortedLayout.map((pos, i) => (
                <div
                    key={i}
                    className="sa-isometric-cell"
                    style={{
                        '--cell-x': pos.x,
                        '--cell-y': pos.y,
                        '--cell-z': pos.z,
                        '--cell-size': `${cellSize}px`,
                        backgroundColor: piece.color,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}

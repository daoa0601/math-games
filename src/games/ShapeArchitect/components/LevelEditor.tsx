import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LevelConfig, Piece, Position3D } from '../logic/types';

interface LevelEditorProps {
    onLevelCreated: (level: LevelConfig) => void;
    onCancel: () => void;
}

const CELL_SIZE = 36;
const MAX_GRID = 10;
const MIN_GRID = 3;

// Preset tetris pieces for selection
const PRESET_PIECES: { id: string; name: string; color: string; layout: Position3D[] }[] = [
    { id: 'I', name: 'I-Block', color: '#00b8d4', layout: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }] },
    { id: 'O', name: 'O-Block', color: '#ffd600', layout: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }] },
    { id: 'T', name: 'T-Block', color: '#aa00ff', layout: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }] },
    { id: 'S', name: 'S-Block', color: '#00c853', layout: [{ x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }] },
    { id: 'Z', name: 'Z-Block', color: '#ff1744', layout: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }] },
    { id: 'J', name: 'J-Block', color: '#304ffe', layout: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }] },
    { id: 'L', name: 'L-Block', color: '#ff6d00', layout: [{ x: 2, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }] },
];

export function LevelEditor({ onLevelCreated, onCancel }: LevelEditorProps) {
    const { t } = useTranslation('shapeArchitect');

    // Editor state
    const [gridWidth, setGridWidth] = useState(6);
    const [gridHeight, setGridHeight] = useState(6);
    const [targetVoxels, setTargetVoxels] = useState<Set<string>>(new Set());
    const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set(['I', 'O', 'T', 'S']));
    const [error, setError] = useState<string | null>(null);
    const [isPainting, setIsPainting] = useState(false);
    const [paintMode, setPaintMode] = useState<'add' | 'remove'>('add');

    // Convert position to key string
    const posToKey = (x: number, y: number) => `${x},${y},0`;

    // Parse key back to position
    const keyToPos = (key: string): Position3D => {
        const [x, y, z] = key.split(',').map(Number);
        return { x, y, z };
    };

    // Handle cell click/drag
    const handleCellInteraction = useCallback((x: number, y: number, isStart: boolean) => {
        const key = posToKey(x, y);

        if (isStart) {
            // Determine paint mode based on current cell state
            const mode = targetVoxels.has(key) ? 'remove' : 'add';
            setPaintMode(mode);
            setIsPainting(true);
        }

        setTargetVoxels(prev => {
            const next = new Set(prev);
            if (paintMode === 'add' || (isStart && !prev.has(key))) {
                next.add(key);
            } else {
                next.delete(key);
            }
            return next;
        });
        setError(null);
    }, [targetVoxels, paintMode]);

    // Handle mouse up to stop painting
    const handleMouseUp = useCallback(() => {
        setIsPainting(false);
    }, []);

    // Toggle piece selection
    const togglePiece = useCallback((pieceId: string) => {
        setSelectedPieces(prev => {
            const next = new Set(prev);
            if (next.has(pieceId)) {
                next.delete(pieceId);
            } else {
                next.add(pieceId);
            }
            return next;
        });
    }, []);

    // Calculate total cells needed from selected pieces
    const totalPieceCells = useMemo(() => {
        return Array.from(selectedPieces).reduce((sum, id) => {
            const piece = PRESET_PIECES.find(p => p.id === id);
            return sum + (piece?.layout.length ?? 0);
        }, 0);
    }, [selectedPieces]);

    // Create level from editor state
    const createLevel = useCallback(() => {
        if (targetVoxels.size === 0) {
            setError(t('editor.noTargetCells'));
            return;
        }

        if (selectedPieces.size === 0) {
            setError(t('editor.noPiecesSelected'));
            return;
        }

        if (totalPieceCells !== targetVoxels.size) {
            setError(t('editor.pieceMismatch', { pieces: totalPieceCells, cells: targetVoxels.size }));
            return;
        }

        // Create pieces with unique IDs
        const pieces: Piece[] = Array.from(selectedPieces).map((id, idx) => {
            const preset = PRESET_PIECES.find(p => p.id === id)!;
            return {
                ...preset,
                id: `custom_${id}_${idx}`,
            };
        });

        const level: LevelConfig = {
            id: `custom_${Date.now()}`,
            name: t('editor.customLevel'),
            type: '2D',
            gridSize: [gridWidth, gridHeight, 1],
            targetVoxels: Array.from(targetVoxels).map(keyToPos),
            pieces,
            difficulty: 'medium',
        };

        onLevelCreated(level);
    }, [targetVoxels, selectedPieces, gridWidth, gridHeight, totalPieceCells, onLevelCreated, t]);

    // Clear all target cells
    const clearAll = useCallback(() => {
        setTargetVoxels(new Set());
        setError(null);
    }, []);

    // Fill all cells
    const fillAll = useCallback(() => {
        const all = new Set<string>();
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                all.add(posToKey(x, y));
            }
        }
        setTargetVoxels(all);
    }, [gridWidth, gridHeight]);

    // Grid dimensions changed - clear targets that are out of bounds
    const handleGridSizeChange = useCallback((newWidth: number, newHeight: number) => {
        setGridWidth(newWidth);
        setGridHeight(newHeight);
        setTargetVoxels(prev => {
            const next = new Set<string>();
            prev.forEach(key => {
                const pos = keyToPos(key);
                if (pos.x < newWidth && pos.y < newHeight) {
                    next.add(key);
                }
            });
            return next;
        });
    }, []);

    return (
        <div className="level-editor" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="level-editor__header">
                <h3>{t('editor.title')}</h3>
                <p className="level-editor__instructions">{t('editor.instructions')}</p>
            </div>

            {/* Grid size controls */}
            <div className="level-editor__size">
                <label>
                    {t('editor.width')}:
                    <input
                        type="number"
                        min={MIN_GRID}
                        max={MAX_GRID}
                        value={gridWidth}
                        onChange={(e) => handleGridSizeChange(Number(e.target.value), gridHeight)}
                    />
                </label>
                <span>×</span>
                <label>
                    {t('editor.height')}:
                    <input
                        type="number"
                        min={MIN_GRID}
                        max={MAX_GRID}
                        value={gridHeight}
                        onChange={(e) => handleGridSizeChange(gridWidth, Number(e.target.value))}
                    />
                </label>
            </div>

            {/* Drawing canvas */}
            <div className="level-editor__canvas-wrapper">
                <div
                    className="level-editor__canvas"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridWidth}, ${CELL_SIZE}px)`,
                        gridTemplateRows: `repeat(${gridHeight}, ${CELL_SIZE}px)`,
                    }}
                >
                    {Array.from({ length: gridHeight }).map((_, y) =>
                        Array.from({ length: gridWidth }).map((_, x) => {
                            const key = posToKey(x, y);
                            const isTarget = targetVoxels.has(key);
                            return (
                                <div
                                    key={key}
                                    className={`editor-cell ${isTarget ? 'editor-cell--target' : ''}`}
                                    onMouseDown={() => handleCellInteraction(x, y, true)}
                                    onMouseEnter={() => isPainting && handleCellInteraction(x, y, false)}
                                />
                            );
                        })
                    )}
                </div>
                <div className="level-editor__quick-actions">
                    <button className="btn btn--small" onClick={fillAll}>{t('editor.fillAll')}</button>
                    <button className="btn btn--small" onClick={clearAll}>{t('editor.clearAll')}</button>
                </div>
            </div>

            {/* Piece selector */}
            <div className="level-editor__pieces">
                <span className="level-editor__pieces-label">{t('editor.selectPieces')}:</span>
                <div className="level-editor__piece-grid">
                    {PRESET_PIECES.map(piece => (
                        <button
                            key={piece.id}
                            className={`piece-btn ${selectedPieces.has(piece.id) ? 'piece-btn--selected' : ''}`}
                            style={{ borderColor: piece.color }}
                            onClick={() => togglePiece(piece.id)}
                            aria-pressed={selectedPieces.has(piece.id)}
                        >
                            <span className="piece-btn__preview" style={{ backgroundColor: piece.color }} />
                            <span className="piece-btn__name">{piece.name}</span>
                            <span className="piece-btn__count">({piece.layout.length})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="level-editor__stats">
                <span>{t('editor.targetCells')}: {targetVoxels.size}</span>
                <span>{t('editor.pieceCells')}: {totalPieceCells}</span>
                <span className={totalPieceCells === targetVoxels.size ? 'match' : 'mismatch'}>
                    {totalPieceCells === targetVoxels.size ? '✓' : '✗'}
                </span>
            </div>

            {/* Error message */}
            {error && (
                <div className="level-editor__error" role="alert">
                    {error}
                </div>
            )}

            {/* Action buttons */}
            <div className="level-editor__actions">
                <button className="btn btn--secondary" onClick={onCancel}>
                    {t('editor.cancel')}
                </button>
                <button
                    className="btn btn--primary"
                    onClick={createLevel}
                    disabled={targetVoxels.size === 0 || selectedPieces.size === 0 || totalPieceCells !== targetVoxels.size}
                >
                    {t('editor.play')}
                </button>
            </div>
        </div>
    );
}

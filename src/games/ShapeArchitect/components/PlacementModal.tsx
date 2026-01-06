import { useRef, useCallback, useEffect, useState, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFocusTrap } from '@/shared/hooks/accessibility';
import type { Piece, Position3D, Rotation3D, CellState } from '../logic/types';
import { canPlacePiece, getPieceWorldPositions } from '../logic/engine';
import { RotationControls } from './RotationControls';
import { useSharedBoxGeometry } from '../hooks';
import { Canvas3DErrorBoundary } from './Canvas3DErrorBoundary';
import './PlacementModal.css';

const SWIPE_THRESHOLD = 100; // px to dismiss

export interface PlacementModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** The piece being placed */
    piece: Piece | null;
    /** Target position on the grid */
    position: Position3D | null;
    /** Current rotation */
    rotation: Rotation3D;
    /** Current grid state */
    grid: CellState[][][];
    /** Grid dimensions */
    gridSize: [number, number, number];
    /** Current view mode */
    viewMode: '2d' | '3d';
    /** Called when rotation changes */
    onRotate: (axis: 'x' | 'y' | 'z') => void;
    /** Called when user confirms placement */
    onConfirm: () => void;
    /** Called when user cancels */
    onCancel: () => void;
}

/**
 * 3D preview of the piece at the target position
 */
function PiecePreview3D({
    piece,
    position,
    rotation,
    isValid,
}: {
    piece: Piece;
    position: Position3D;
    rotation: Rotation3D;
    isValid: boolean;
}) {
    const sharedGeometry = useSharedBoxGeometry();
    const worldPositions = getPieceWorldPositions(piece, position, rotation);

    // Guard against empty positions array to prevent division by zero
    if (worldPositions.length === 0) {
        return null;
    }

    // Calculate center offset for the preview
    const centerX = worldPositions.reduce((sum, p) => sum + p.x, 0) / worldPositions.length;
    const centerY = worldPositions.reduce((sum, p) => sum + p.y, 0) / worldPositions.length;
    const centerZ = worldPositions.reduce((sum, p) => sum + p.z, 0) / worldPositions.length;

    return (
        <>
            <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
            <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={2} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#b4d4ff" />

            <group position={[-centerX, -centerY, -centerZ]}>
                {worldPositions.map((pos, i) => (
                    <mesh
                        key={i}
                        position={[pos.x, pos.y, pos.z]}
                        geometry={sharedGeometry}
                    >
                        <meshStandardMaterial
                            color={isValid ? piece.color : '#ef4444'}
                            opacity={isValid ? 1 : 0.7}
                            transparent={!isValid}
                        />
                    </mesh>
                ))}
            </group>
        </>
    );
}

/**
 * 2D preview grid showing the piece shape
 */
function PiecePreview2D({
    piece,
    rotation,
    isValid,
}: {
    piece: Piece;
    rotation: Rotation3D;
    isValid: boolean;
}) {
    // Get world positions at origin to see the rotated shape
    const worldPositions = getPieceWorldPositions(piece, { x: 0, y: 0, z: 0 }, rotation);

    // Guard against empty positions array
    if (worldPositions.length === 0) {
        return null;
    }

    // Calculate bounds
    const minX = Math.min(...worldPositions.map(p => p.x));
    const minY = Math.min(...worldPositions.map(p => p.y));
    const maxX = Math.max(...worldPositions.map(p => p.x));
    const maxY = Math.max(...worldPositions.map(p => p.y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // Normalize positions
    const normalizedPositions = worldPositions.map(p => ({
        x: p.x - minX,
        y: p.y - minY,
    }));

    // Create grid
    const grid: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
    normalizedPositions.forEach(p => {
        if (p.y >= 0 && p.y < height && p.x >= 0 && p.x < width) {
            grid[p.y][p.x] = true;
        }
    });

    return (
        <div
            className={`placement-modal__2d-preview ${isValid ? 'placement-modal__2d-preview--valid' : 'placement-modal__2d-preview--invalid'}`}
        >
            {[...grid].reverse().map((row, y) => (
                <div key={y} className="placement-modal__2d-row">
                    {row.map((filled, x) => (
                        <div
                            key={x}
                            className={`placement-modal__2d-cell ${filled ? 'placement-modal__2d-cell--filled' : ''}`}
                            style={{
                                backgroundColor: filled ? (isValid ? piece.color : '#ef4444') : undefined,
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * PlacementModal
 *
 * Modal for confirming piece placement with rotation preview.
 * Shows the piece at the target position and allows rotation before confirming.
 */
export function PlacementModal({
    isOpen,
    piece,
    position,
    rotation,
    grid,
    gridSize,
    viewMode,
    onRotate,
    onConfirm,
    onCancel,
}: PlacementModalProps) {
    const { t } = useTranslation('shapeArchitect');
    const containerRef = useRef<HTMLDivElement>(null);

    // Swipe-to-dismiss state for mobile bottom sheet
    // Reset swipe offset when modal opens by using key derived from isOpen transitions
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    // Check if placement is valid
    const isValid = piece && position
        ? canPlacePiece(grid, piece, position, rotation, gridSize)
        : false;

    // Use ref to track isValid without triggering callback recreation
    const isValidRef = useRef(isValid);
    useEffect(() => {
        isValidRef.current = isValid;
    }, [isValid]);

    // Touch handlers for swipe-to-dismiss
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientY);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchStart === null) return;

        const currentY = e.touches[0].clientY;
        const delta = currentY - touchStart;

        // Only allow swiping down (positive delta)
        if (delta > 0) {
            setSwipeOffset(delta);
        }
    }, [touchStart]);

    const handleTouchEnd = useCallback(() => {
        if (swipeOffset > SWIPE_THRESHOLD) {
            // Dismiss the modal
            onCancel();
        }
        // Reset
        setSwipeOffset(0);
        setTouchStart(null);
    }, [swipeOffset, onCancel]);

    // Focus trap for accessibility
    useFocusTrap({
        containerRef,
        onEscape: onCancel,
        enabled: isOpen,
        autoFocus: true,
        restoreFocus: true,
    });

    // Keyboard shortcuts for rotation and confirm
    // Note: Escape is handled by useFocusTrap via onEscape callback
    // Using ref for isValid to avoid recreating callback on every validity change
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key.toLowerCase()) {
            case 'r':
                e.preventDefault();
                onRotate('z');
                break;
            case 't':
                e.preventDefault();
                onRotate('x');
                break;
            case 'y':
                e.preventDefault();
                onRotate('y');
                break;
            case 'enter':
                e.preventDefault();
                if (isValidRef.current) {
                    onConfirm();
                }
                break;
        }
    }, [onRotate, onConfirm]);

    // Only register keyboard listener when modal is open
    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    if (!isOpen || !piece || !position) return null;

    const modalContent = (
        <div className="placement-modal" onClick={onCancel}>
            <div className="placement-modal__backdrop" aria-hidden="true" />
            <div
                className={`placement-modal__card ${isValid ? 'placement-modal__card--valid' : 'placement-modal__card--invalid'}`}
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="placement-modal-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                    transform: swipeOffset > 0 ? `translateY(${swipeOffset}px)` : undefined,
                    transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
                }}
            >
                {/* Drag handle for mobile swipe-to-dismiss */}
                <div
                    className="placement-modal__drag-handle"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    aria-hidden="true"
                />
                <header className="placement-modal__header">
                    <h2 id="placement-modal-title" className="placement-modal__title">
                        {t('modal.placePiece', 'Place {{piece}}', { piece: piece.name })}
                    </h2>
                    <button
                        className="placement-modal__close"
                        onClick={onCancel}
                        aria-label={t('modal.cancel', 'Cancel')}
                        type="button"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </header>

                <div className="placement-modal__body">
                    {/* Preview area */}
                    <div className="placement-modal__preview">
                        {viewMode === '3d' ? (
                            <div className="placement-modal__3d-container">
                                <Canvas3DErrorBoundary
                                    fallback={
                                        <PiecePreview2D
                                            piece={piece}
                                            rotation={rotation}
                                            isValid={isValid}
                                        />
                                    }
                                >
                                    <Canvas>
                                        <Suspense fallback={null}>
                                            <PiecePreview3D
                                                piece={piece}
                                                position={position}
                                                rotation={rotation}
                                                isValid={isValid}
                                            />
                                        </Suspense>
                                    </Canvas>
                                </Canvas3DErrorBoundary>
                            </div>
                        ) : (
                            <PiecePreview2D
                                piece={piece}
                                rotation={rotation}
                                isValid={isValid}
                            />
                        )}
                    </div>

                    {/* Validity indicator */}
                    <div className={`placement-modal__validity ${isValid ? 'placement-modal__validity--valid' : 'placement-modal__validity--invalid'}`}>
                        {isValid ? (
                            <>
                                <span className="placement-modal__validity-icon">✓</span>
                                {t('modal.validPlacement', 'Valid placement')}
                            </>
                        ) : (
                            <>
                                <span className="placement-modal__validity-icon">✗</span>
                                {t('modal.invalidPlacement', 'Invalid - piece overlaps or out of bounds')}
                            </>
                        )}
                    </div>

                    {/* Rotation controls */}
                    <div className="placement-modal__controls">
                        <RotationControls
                            rotation={rotation}
                            onRotateX={() => onRotate('x')}
                            onRotateY={() => onRotate('y')}
                            onRotateZ={() => onRotate('z')}
                            mode={viewMode === '2d' ? '2D' : '3D'}
                        />
                    </div>

                    {/* Position info */}
                    <div className="placement-modal__position">
                        {t('modal.position', 'Position')}: ({position.x}, {position.y}, {position.z})
                    </div>
                </div>

                <footer className="placement-modal__footer">
                    <button
                        className="action action--secondary"
                        onClick={onCancel}
                    >
                        {t('modal.cancel', 'Cancel')}
                    </button>
                    <button
                        className="action action--primary"
                        onClick={onConfirm}
                        disabled={!isValid}
                    >
                        {t('modal.confirm', 'Place')} (Enter)
                    </button>
                </footer>

                {/* Keyboard hints */}
                <div className="placement-modal__hints">
                    <span>R/T/Y: {t('modal.rotate', 'Rotate')}</span>
                    <span>Enter: {t('modal.confirm', 'Place')}</span>
                    <span>Esc: {t('modal.cancel', 'Cancel')}</span>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

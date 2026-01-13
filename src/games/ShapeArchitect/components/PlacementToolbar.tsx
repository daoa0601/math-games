import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '@/shared/hooks/accessibility';
import type { Piece, Position3D, CellState } from '../logic/types';
import { canPlacePiece } from '../logic/engine';
import './PlacementToolbar.css';

export interface PlacementToolbarProps {
    /** Whether the toolbar is visible */
    isOpen: boolean;
    /** The piece being placed */
    piece: Piece | null;
    /** Target position on the grid */
    position: Position3D | null;
    /** Current rotation */
    rotation: { x: number; y: number; z: number };
    /** Current grid state */
    grid: CellState[][][];
    /** Grid dimensions */
    gridSize: [number, number, number];
    /** Called when rotation changes */
    onRotate: (axis: 'x' | 'y' | 'z') => void;
    /** Called when user confirms placement */
    onConfirm: () => void;
    /** Called when user cancels */
    onCancel: () => void;
}

/**
 * PlacementToolbar
 *
 * Compact inline toolbar for piece placement with rotation controls.
 * Replaces the full-screen PlacementModal with a minimal, non-blocking UI.
 */
export function PlacementToolbar({
    isOpen,
    piece,
    position,
    rotation,
    grid,
    gridSize,
    onRotate,
    onConfirm,
    onCancel,
}: PlacementToolbarProps) {
    const { t } = useTranslation('shapeArchitect');
    const containerRef = useRef<HTMLDivElement>(null);

    // Check if placement is valid
    const isValid = piece && position
        ? canPlacePiece(grid, piece, position, rotation, gridSize)
        : false;

    // Use ref to track isValid without triggering callback recreation
    const isValidRef = useRef(isValid);
    useEffect(() => {
        isValidRef.current = isValid;
    }, [isValid]);

    // Focus trap for accessibility
    useFocusTrap({
        containerRef,
        onEscape: onCancel,
        enabled: isOpen,
        autoFocus: true,
        restoreFocus: true,
    });

    // Keyboard shortcuts for rotation and confirm
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

    // Register keyboard listener when toolbar is open
    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    if (!isOpen || !piece || !position) return null;

    return (
        <div
            className={`placement-toolbar ${isValid ? 'placement-toolbar--valid' : 'placement-toolbar--invalid'}`}
            ref={containerRef}
            role="toolbar"
            aria-label={t('toolbar.placePiece', 'Place piece controls')}
        >
            {/* Piece name */}
            <span className="placement-toolbar__label">
                {piece.name}
            </span>

            {/* Rotation controls */}
            <div className="placement-toolbar__controls">
                <button
                    className="placement-toolbar__btn"
                    onClick={() => onRotate('x')}
                    title={`${t('toolbar.rotateX', 'Rotate X')} (T)`}
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <text x="12" y="20" fontSize="8" fill="currentColor" textAnchor="middle">X</text>
                    </svg>
                </button>
                <button
                    className="placement-toolbar__btn"
                    onClick={() => onRotate('y')}
                    title={`${t('toolbar.rotateY', 'Rotate Y')} (Y)`}
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <text x="12" y="20" fontSize="8" fill="currentColor" textAnchor="middle">Y</text>
                    </svg>
                </button>
                <button
                    className="placement-toolbar__btn"
                    onClick={() => onRotate('z')}
                    title={`${t('toolbar.rotateZ', 'Rotate Z')} (R)`}
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <text x="12" y="20" fontSize="8" fill="currentColor" textAnchor="middle">Z</text>
                    </svg>
                </button>
            </div>

            {/* Validity indicator */}
            <span className={`placement-toolbar__status ${isValid ? 'placement-toolbar__status--valid' : 'placement-toolbar__status--invalid'}`}>
                {isValid ? '✓' : '✗'}
            </span>

            {/* Actions */}
            <div className="placement-toolbar__actions">
                <button
                    className="placement-toolbar__btn placement-toolbar__btn--confirm"
                    onClick={onConfirm}
                    disabled={!isValid}
                    title={`${t('toolbar.confirm', 'Place')} (Enter)`}
                    type="button"
                >
                    ✓
                </button>
                <button
                    className="placement-toolbar__btn placement-toolbar__btn--cancel"
                    onClick={onCancel}
                    title={`${t('toolbar.cancel', 'Cancel')} (Esc)`}
                    type="button"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

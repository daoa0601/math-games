import { useTranslation } from 'react-i18next';
import type { Rotation3D } from '../logic/types';
import './PlacedPieceControls.css';

interface PlacedPieceControlsProps {
    /** Currently selected placed piece ID */
    selectedPieceId: string | null;
    /** Current rotation for the piece being moved */
    rotation: Rotation3D;
    /** Rotate piece around an axis */
    onRotateAxis: (axis: 'x' | 'y' | 'z') => void;
    /** Cancel movement selection */
    onCancel: () => void;
    /** Whether rotation is limited to Z-axis (2D mode) */
    is2DMode?: boolean;
    /** Whether controls are disabled */
    disabled?: boolean;
}

/**
 * Mobile-friendly bottom sheet controls for moving placed pieces.
 * Shows rotation buttons and cancel action when a piece is selected.
 */
export function PlacedPieceControls({
    selectedPieceId,
    rotation,
    onRotateAxis,
    onCancel,
    is2DMode = false,
    disabled = false,
}: PlacedPieceControlsProps) {
    const { t } = useTranslation('shapeArchitect');

    // Don't render if no piece is selected
    if (!selectedPieceId) {
        return null;
    }

    return (
        <div className="placed-piece-controls" role="toolbar" aria-label={t('controls.moveControls', 'Move piece controls')}>
            <div className="placed-piece-controls__header">
                <span className="placed-piece-controls__icon">✋</span>
                <span className="placed-piece-controls__title">
                    {t('controls.movingPiece', 'Moving piece')}
                </span>
            </div>

            <div className="placed-piece-controls__rotation">
                <span className="placed-piece-controls__label">
                    {t('controls.rotateLabel', 'Rotate:')}
                </span>
                <div className="placed-piece-controls__buttons">
                    {!is2DMode && (
                        <>
                            <button
                                className="action action--sm action--icon placed-piece-controls__btn"
                                onClick={() => onRotateAxis('x')}
                                disabled={disabled}
                                title={`X: ${rotation.x}°`}
                                aria-label={t('controls.rotateX', 'Rotate X axis')}
                            >
                                ↻X
                            </button>
                            <button
                                className="action action--sm action--icon placed-piece-controls__btn"
                                onClick={() => onRotateAxis('y')}
                                disabled={disabled}
                                title={`Y: ${rotation.y}°`}
                                aria-label={t('controls.rotateY', 'Rotate Y axis')}
                            >
                                ↻Y
                            </button>
                        </>
                    )}
                    <button
                        className="action action--sm action--icon placed-piece-controls__btn"
                        onClick={() => onRotateAxis('z')}
                        disabled={disabled}
                        title={`Z: ${rotation.z}°`}
                        aria-label={t('controls.rotateZ', 'Rotate Z axis')}
                    >
                        ↻Z
                    </button>
                </div>
            </div>

            <div className="placed-piece-controls__actions">
                <button
                    className="action action--secondary placed-piece-controls__cancel"
                    onClick={onCancel}
                    disabled={disabled}
                >
                    {t('controls.cancelMove', 'Cancel')}
                </button>
            </div>

            <div className="placed-piece-controls__hint">
                {t('controls.moveHint', 'Tap a target cell to move the piece there')}
            </div>
        </div>
    );
}

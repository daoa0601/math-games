// ========================================
// Layer Visibility Controls
// ========================================
// Allows players to slice through 3D puzzles
// by hiding layers above a certain z-level

interface LayerControlsProps {
    /** Total number of z-layers in the grid */
    depth: number;
    /** Maximum visible layer index (0 = bottom only, depth-1 = all visible) */
    maxVisibleLayer: number;
    /** Callback when layer changes */
    onChange: (layer: number) => void;
    /** Whether the control is disabled */
    disabled?: boolean;
}

// Layer icons for the visibility control
function LayersIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="layer-controls__icon">
            {/* Stack of layers */}
            <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function LayerControls({
    depth,
    maxVisibleLayer,
    onChange,
    disabled = false,
}: LayerControlsProps) {
    // Only show for multi-layer puzzles
    if (depth <= 1) {
        return null;
    }

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(parseInt(e.target.value, 10));
    };

    // Labels for layer positions
    const isShowingAll = maxVisibleLayer >= depth - 1;
    const displayLabel = isShowingAll ? 'All' : `Layer ${maxVisibleLayer + 1}`;

    return (
        <div
            className={`layer-controls ${disabled ? 'layer-controls--disabled' : ''}`}
            role="group"
            aria-label="Layer visibility controls"
        >
            <div className="layer-controls__header">
                <LayersIcon />
                <span className="layer-controls__title">Layers</span>
            </div>

            <div className="layer-controls__slider-wrapper">
                <span className="layer-controls__label layer-controls__label--min">1</span>
                <input
                    type="range"
                    className="layer-controls__slider"
                    min={0}
                    max={depth - 1}
                    value={maxVisibleLayer}
                    onChange={handleSliderChange}
                    disabled={disabled}
                    aria-label={`Show layers up to ${maxVisibleLayer + 1}`}
                    aria-valuemin={1}
                    aria-valuemax={depth}
                    aria-valuenow={maxVisibleLayer + 1}
                />
                <span className="layer-controls__label layer-controls__label--max">{depth}</span>
            </div>

            <div className="layer-controls__display">
                <span className="layer-controls__current">{displayLabel}</span>
            </div>

            {/* Quick buttons for common actions */}
            <div className="layer-controls__buttons">
                <button
                    className="layer-controls__btn"
                    onClick={() => onChange(0)}
                    disabled={disabled || maxVisibleLayer === 0}
                    title="Show bottom layer only"
                    aria-label="Show bottom layer only"
                >
                    <svg viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="10" width="10" height="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </button>
                <button
                    className="layer-controls__btn"
                    onClick={() => onChange(Math.max(0, maxVisibleLayer - 1))}
                    disabled={disabled || maxVisibleLayer === 0}
                    title="Hide one layer"
                    aria-label="Hide one layer"
                >
                    <svg viewBox="0 0 16 16" fill="none">
                        <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    className="layer-controls__btn"
                    onClick={() => onChange(Math.min(depth - 1, maxVisibleLayer + 1))}
                    disabled={disabled || maxVisibleLayer >= depth - 1}
                    title="Show one more layer"
                    aria-label="Show one more layer"
                >
                    <svg viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    className="layer-controls__btn"
                    onClick={() => onChange(depth - 1)}
                    disabled={disabled || maxVisibleLayer >= depth - 1}
                    title="Show all layers"
                    aria-label="Show all layers"
                >
                    <svg viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="3" width="10" height="3" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="3" y="7" width="10" height="3" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                        <rect x="3" y="11" width="10" height="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

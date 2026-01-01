// ========================================
// Rotation Controls Types
// ========================================

export interface Rotation3D {
    x: number;
    y: number;
    z: number;
}

interface RotationControlsProps {
    rotation: Rotation3D;
    onRotateX: () => void;
    onRotateY: () => void;
    onRotateZ: () => void;
    disabled?: boolean;
}

// ========================================
// Axis-Specific Rotation Icons (3D Arrow Loops)
// ========================================

function RotateXIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="rotation-dial__icon">
            {/* X-axis rotation - arrow looping around horizontal axis */}
            <ellipse
                cx="12"
                cy="12"
                rx="8"
                ry="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="3 2"
                opacity="0.4"
            />
            <path
                d="M4 12C4 9.5 7.5 7.5 12 7.5C16.5 7.5 20 9.5 20 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M20 12L17.5 9.5M20 12L17.5 14.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function RotateYIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="rotation-dial__icon">
            {/* Y-axis rotation - arrow looping around vertical axis */}
            <ellipse
                cx="12"
                cy="12"
                rx="4"
                ry="8"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="3 2"
                opacity="0.4"
            />
            <path
                d="M12 4C9.5 4 7.5 7.5 7.5 12C7.5 16.5 9.5 20 12 20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M12 20L9.5 17.5M12 20L14.5 17.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function RotateZIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="rotation-dial__icon">
            {/* Z-axis rotation - classic circular arrow */}
            <circle
                cx="12"
                cy="12"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="3 2"
                opacity="0.4"
            />
            <path
                d="M12 5C8.13 5 5 8.13 5 12C5 14.5 6.3 16.7 8.3 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M8.3 18L5.5 17M8.3 18L9 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ========================================
// Rotation Controls Component
// ========================================

const AXIS_CONFIG = {
    x: {
        icon: RotateXIcon,
        label: 'X',
        color: 'var(--axis-x-color)',
        shortcut: 'T',
        tooltip: 'Pitch (T)',
    },
    y: {
        icon: RotateYIcon,
        label: 'Y',
        color: 'var(--axis-y-color)',
        shortcut: 'Y',
        tooltip: 'Yaw (Y)',
    },
    z: {
        icon: RotateZIcon,
        label: 'Z',
        color: 'var(--axis-z-color)',
        shortcut: 'R',
        tooltip: 'Roll (R)',
    },
} as const;

type AxisKey = keyof typeof AXIS_CONFIG;

export function RotationControls({
    rotation,
    onRotateX,
    onRotateY,
    onRotateZ,
    disabled = false,
}: RotationControlsProps) {
    const handlers: Record<AxisKey, () => void> = {
        x: onRotateX,
        y: onRotateY,
        z: onRotateZ,
    };

    const angles: Record<AxisKey, number> = {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
    };

    // Keyboard shortcuts are handled by the parent component
    // This is just for reference in tooltips

    const axisOrder: AxisKey[] = ['x', 'y', 'z'];

    return (
        <div
            className={`rotation-controls ${disabled ? 'rotation-controls--disabled' : ''}`}
            role="group"
            aria-label="3D piece rotation controls"
        >
            <span className="rotation-controls__label">Rotate</span>
            <div className="rotation-controls__dials">
                {axisOrder.map((axis) => {
                    const config = AXIS_CONFIG[axis];
                    const Icon = config.icon;
                    const angle = angles[axis];
                    const isActive = angle !== 0;

                    return (
                        <button
                            key={axis}
                            className={`rotation-dial ${isActive ? 'rotation-dial--active' : ''}`}
                            style={{ '--dial-color': config.color } as React.CSSProperties}
                            onClick={handlers[axis]}
                            disabled={disabled}
                            title={`${config.tooltip} - Current: ${angle}°`}
                            aria-label={`Rotate ${axis.toUpperCase()} axis by 90 degrees. Current: ${angle} degrees`}
                        >
                            <div className="rotation-dial__face">
                                <Icon />
                                <span className="rotation-dial__axis">{config.label}</span>
                            </div>
                            <span className="rotation-dial__angle">{angle}°</span>
                            <span className="rotation-dial__shortcut">{config.shortcut}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

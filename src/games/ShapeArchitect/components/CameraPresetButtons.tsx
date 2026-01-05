import { useCallback, useEffect } from 'react';

// ========================================
// Camera Preset Types & Constants
// ========================================

export type CameraPreset = 'isometric' | 'top' | 'front' | 'side' | 'reset';

export interface CameraPosition {
    position: [number, number, number];
    target: [number, number, number];
}

export const CAMERA_PRESETS: Record<CameraPreset, CameraPosition> = {
    isometric: { position: [8, 6, 8], target: [0, 0, 0] },
    top: { position: [0, 12, 0.001], target: [0, 0, 0] },
    front: { position: [0, 3, 12], target: [0, 0, 0] },
    side: { position: [12, 3, 0], target: [0, 0, 0] },
    reset: { position: [8, 6, 8], target: [0, 0, 0] },
} as const;

// ========================================
// Blueprint-style Icons
// ========================================

function IsometricIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="sa-camera__icon">
            <path
                d="M12 2L22 8V16L12 22L2 16V8L12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="M12 22V12M12 12L2 8M12 12L22 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function TopIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="sa-camera__icon">
            <rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 4V8M12 16V20M4 12H8M16 12H20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
    );
}

function FrontIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="sa-camera__icon">
            <rect
                x="3"
                y="6"
                width="18"
                height="12"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path d="M3 10H21" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <path d="M8 6V18M16 6V18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
    );
}

function SideIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="sa-camera__icon">
            <path
                d="M6 6L18 6L18 18L6 18L6 6Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M6 6L10 3L22 3L22 15L18 18"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path d="M18 6L22 3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function ResetIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="sa-camera__icon">
            <path
                d="M4 12C4 7.58172 7.58172 4 12 4C15.0736 4 17.7297 5.67319 19.1654 8.14286"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M20 12C20 16.4183 16.4183 20 12 20C8.92644 20 6.27034 18.3268 4.83459 15.8571"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M15 8H19.5V3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9 16H4.5V20.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const PRESET_CONFIG: Record<CameraPreset, { icon: React.FC; label: string; shortcut: string }> = {
    isometric: { icon: IsometricIcon, label: 'Iso', shortcut: '1' },
    top: { icon: TopIcon, label: 'Top', shortcut: '2' },
    front: { icon: FrontIcon, label: 'Front', shortcut: '3' },
    side: { icon: SideIcon, label: 'Side', shortcut: '4' },
    reset: { icon: ResetIcon, label: 'Reset', shortcut: '5' },
};

// ========================================
// Camera Preset Buttons Component
// ========================================

interface CameraPresetButtonsProps {
    activePreset: CameraPreset;
    onPresetChange: (preset: CameraPreset) => void;
}

export function CameraPresetButtons({ activePreset, onPresetChange }: CameraPresetButtonsProps) {
    // Keyboard shortcuts
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const keyMap: Record<string, CameraPreset> = {
                '1': 'isometric',
                '2': 'top',
                '3': 'front',
                '4': 'side',
                '5': 'reset',
            };

            if (keyMap[e.key]) {
                e.preventDefault();
                onPresetChange(keyMap[e.key]);
            }
        },
        [onPresetChange]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const presetOrder: CameraPreset[] = ['isometric', 'top', 'front', 'side', 'reset'];

    return (
        <div className="sa-camera" role="group" aria-label="Camera view presets">
            {presetOrder.map((preset) => {
                const config = PRESET_CONFIG[preset];
                const Icon = config.icon;
                const isActive = activePreset === preset;

                return (
                    <button
                        key={preset}
                        className={`sa-camera__btn ${isActive ? 'sa-camera__btn--active' : ''}`}
                        onClick={() => onPresetChange(preset)}
                        aria-pressed={isActive}
                        title={`${config.label} view (${config.shortcut})`}
                    >
                        <Icon />
                        <span className="sa-camera__label">{config.label}</span>
                        <span className="sa-camera__shortcut">{config.shortcut}</span>
                    </button>
                );
            })}
        </div>
    );
}

import { useHighContrast } from '../hooks';

interface HighContrastToggleProps {
    className?: string;
}

/**
 * Toggle button for high contrast mode accessibility setting.
 * Uses the shared useHighContrast hook for state management.
 */
export function HighContrastToggle({ className = '' }: HighContrastToggleProps) {
    const { isHighContrast, toggleHighContrast } = useHighContrast();

    return (
        <button
            className={`high-contrast-toggle ${className}`.trim()}
            onClick={toggleHighContrast}
            aria-pressed={isHighContrast}
            aria-label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            title={isHighContrast ? 'High contrast: ON' : 'High contrast: OFF'}
        >
            {isHighContrast ? '◐' : '◑'}
        </button>
    );
}

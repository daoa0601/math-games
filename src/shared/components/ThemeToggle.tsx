import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/shadcn';
import { useTheme, type Theme } from '@/shared/contexts';
// Removed ThemeToggle.css to see shadcn Button styles

export interface ThemeToggleProps {
    /** Optional className for positioning */
    className?: string;
}

/**
 * Theme toggle button for navigation.
 *
 * Features:
 * - Sun/moon/system icons that indicate current theme
 * - Cycles: light → dark → system → light
 * - Persists preference to localStorage via ThemeContext
 * - Accessible with proper ARIA labels
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { t } = useTranslation('common');
    const { theme, setTheme } = useTheme();

    const handleToggle = () => {
        // Cycle: light → dark → system → light
        const nextTheme: Theme =
            theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        setTheme(nextTheme);
    };

    const getIcon = () => {
        // Sun icon for light mode
        if (theme === 'light') {
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            );
        }
        // Moon icon for dark mode
        if (theme === 'dark') {
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            );
        }
        // System icon (circle with dot)
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
        );
    };

    const ariaLabel = t(`theme.${theme}`, `Theme: ${theme}`);

    return (
        <Button
            variant="ghost"
            size="icon"
            className={className}
            onClick={handleToggle}
            aria-label={ariaLabel}
            aria-pressed={theme !== 'system'}
            title={ariaLabel}
        >
            {getIcon()}
        </Button>
    );
}

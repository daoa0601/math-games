import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/shadcn';
import { isSoundEnabled, toggleSound } from '../utils';
// Removed SoundToggle.css to see shadcn Button styles

export interface SoundToggleProps {
    /** Optional className for positioning */
    className?: string;
}

/**
 * Sound toggle button for game headers.
 *
 * Features:
 * - Animated speaker icon with sound waves
 * - Persists preference to localStorage
 * - Accessible with proper ARIA labels
 */
export function SoundToggle({ className = '' }: SoundToggleProps) {
    const { t } = useTranslation('common');
    // Use lazy initialization to read from localStorage once on mount
    const [enabled, setEnabled] = useState(() => isSoundEnabled());

    const handleToggle = () => {
        const newState = !enabled;
        toggleSound(newState);
        setEnabled(newState);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={className}
            onClick={handleToggle}
            aria-label={enabled
                ? t('sound.disable', 'Mute sounds')
                : t('sound.enable', 'Enable sounds')
            }
            aria-pressed={enabled}
            title={enabled
                ? t('sound.disable', 'Mute sounds')
                : t('sound.enable', 'Enable sounds')
            }
        >
            {enabled ? (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {/* Speaker body */}
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    {/* Sound waves */}
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
            ) : (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {/* Speaker body */}
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    {/* X mark */}
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
            )}
        </Button>
    );
}

// ========================================
// useHighContrast - High Contrast Mode Hook
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { HIGH_CONTRAST_KEY } from '@/shared/constants';

/**
 * Hook to manage high contrast mode for accessibility.
 * Persists preference to localStorage and toggles CSS class on document.
 */
export function useHighContrast() {
    const [isHighContrast, setIsHighContrast] = useState(() => {
        // Initialize from localStorage or system preference
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(HIGH_CONTRAST_KEY);
            if (stored !== null) {
                return stored === 'true';
            }
            // Check system preference
            return window.matchMedia?.('(prefers-contrast: more)')?.matches ?? false;
        }
        return false;
    });

    // Apply class to document when state changes
    useEffect(() => {
        if (isHighContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }, [isHighContrast]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia?.('(prefers-contrast: more)');
        if (!mediaQuery) return;

        const handler = (e: MediaQueryListEvent) => {
            // Only update if user hasn't set a preference
            if (localStorage.getItem(HIGH_CONTRAST_KEY) === null) {
                setIsHighContrast(e.matches);
            }
        };

        mediaQuery.addEventListener?.('change', handler);
        return () => mediaQuery.removeEventListener?.('change', handler);
    }, []);

    // Toggle high contrast mode
    const toggleHighContrast = useCallback(() => {
        setIsHighContrast(prev => {
            const newValue = !prev;
            localStorage.setItem(HIGH_CONTRAST_KEY, String(newValue));
            return newValue;
        });
    }, []);

    // Set high contrast mode explicitly
    const setHighContrast = useCallback((enabled: boolean) => {
        localStorage.setItem(HIGH_CONTRAST_KEY, String(enabled));
        setIsHighContrast(enabled);
    }, []);

    return {
        isHighContrast,
        toggleHighContrast,
        setHighContrast,
    };
}

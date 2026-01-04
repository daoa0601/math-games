import { useCallback, useRef, useEffect } from 'react';
import type { Position3D } from '../logic/types';

/**
 * Throttles hover position updates to reduce React state updates and re-renders.
 * First call is immediate, subsequent calls within the throttle period are delayed.
 */
export function useThrottledHover(
    handler: (position: Position3D | null) => void,
    throttleMs: number = 50
): (position: Position3D | null) => void {
    const lastCallRef = useRef<number>(0);
    const pendingValueRef = useRef<Position3D | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handlerRef = useRef(handler);

    // Keep handler ref up to date (in effect to avoid accessing refs during render)
    useEffect(() => {
        handlerRef.current = handler;
    });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const throttledHandler = useCallback((position: Position3D | null) => {
        const now = Date.now();
        const elapsed = now - lastCallRef.current;

        if (elapsed >= throttleMs) {
            // Enough time has passed, call immediately
            lastCallRef.current = now;
            handlerRef.current(position);
        } else {
            // Store the pending value and schedule a call
            pendingValueRef.current = position;

            // Only schedule if not already scheduled
            if (!timeoutRef.current) {
                const remaining = throttleMs - elapsed;
                timeoutRef.current = setTimeout(() => {
                    lastCallRef.current = Date.now();
                    handlerRef.current(pendingValueRef.current);
                    timeoutRef.current = null;
                }, remaining);
            }
        }
    }, [throttleMs]);

    return throttledHandler;
}

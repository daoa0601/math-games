/**
 * useHistory Hook
 *
 * Manages undo/redo history using the classic two-stack approach.
 * Includes keyboard shortcuts (Ctrl+Z/Y or Cmd+Z/Y on Mac).
 *
 * Key behavior:
 * - `set()` pushes current state to past stack, clears future
 * - `undo()` pops from past, pushes current to future
 * - `redo()` pops from future, pushes current to past
 * - History limited by `maxHistory` param (default 50)
 *
 * @example
 * ```tsx
 * const [placements, { set, undo, redo, canUndo, canRedo }] = useHistory(initialMap);
 *
 * // Update state (adds to history)
 * set(new Map([...placements, [nodeId, value]]));
 *
 * // Undo/redo buttons
 * <button onClick={undo} disabled={!canUndo}>Undo</button>
 * <button onClick={redo} disabled={!canRedo}>Redo</button>
 * ```
 */

import { useState, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface HistoryState<T> {
    current: T;
    past: T[];
    future: T[];
}

export interface HistoryActions<T> {
    /** Set new state (pushes current to history) */
    set: (newState: T) => void;
    /** Undo to previous state */
    undo: () => void;
    /** Redo to next state */
    redo: () => void;
    /** Reset to a new initial state (clears all history) */
    reset: (initialState: T) => void;
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useHistory<T>(
    initialState: T,
    maxHistory: number = 50
): [T, HistoryActions<T>] {
    const [history, setHistory] = useState<HistoryState<T>>({
        current: initialState,
        past: [],
        future: [],
    });

    // Set new state (pushes current to past, clears future)
    const set = useCallback((newState: T) => {
        setHistory(prev => ({
            current: newState,
            past: [prev.current, ...prev.past].slice(0, maxHistory),
            future: [], // Clear future on new action
        }));
    }, [maxHistory]);

    // Undo: pop from past, push current to future
    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const [previous, ...remaining] = prev.past;
            return {
                current: previous,
                past: remaining,
                future: [prev.current, ...prev.future],
            };
        });
    }, []);

    // Redo: pop from future, push current to past
    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const [next, ...remaining] = prev.future;
            return {
                current: next,
                past: [prev.current, ...prev.past],
                future: remaining,
            };
        });
    }, []);

    // Reset to a new initial state (clears all history)
    const reset = useCallback((newInitialState: T) => {
        setHistory({
            current: newInitialState,
            past: [],
            future: [],
        });
    }, []);

    // Keyboard shortcuts: Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for undo: Ctrl+Z (or Cmd+Z on Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            // Check for redo: Ctrl+Y or Ctrl+Shift+Z (or Cmd equivalents)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const actions: HistoryActions<T> = {
        set,
        undo,
        redo,
        reset,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
    };

    return [history.current, actions];
}

// ═══════════════════════════════════════════════════════════════════
// MAP UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Serializes a Map to a plain object for comparison/storage.
 * Useful when using Maps with useHistory since React state needs
 * immutable value semantics.
 */
export function serializeMap<K extends string, V>(map: Map<K, V>): Record<K, V> {
    const obj = {} as Record<K, V>;
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}

/**
 * Deserializes a plain object back to a Map.
 */
export function deserializeMap<K extends string, V>(obj: Record<K, V>): Map<K, V> {
    return new Map(Object.entries(obj)) as Map<K, V>;
}

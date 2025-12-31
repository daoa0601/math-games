import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory, serializeMap, deserializeMap } from '../useHistory';

describe('useHistory Hook', () => {
    describe('basic state management', () => {
        it('initializes with provided state', () => {
            const { result } = renderHook(() => useHistory({ value: 1 }));
            const [current] = result.current;

            expect(current).toEqual({ value: 1 });
        });

        it('updates state with set()', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].set(5);
            });

            expect(result.current[0]).toBe(5);
        });
    });

    describe('undo functionality', () => {
        it('canUndo is false initially', () => {
            const { result } = renderHook(() => useHistory(0));

            expect(result.current[1].canUndo).toBe(false);
        });

        it('canUndo is true after set()', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].set(1);
            });

            expect(result.current[1].canUndo).toBe(true);
        });

        it('undo restores previous state', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].set(1);
                result.current[1].set(2);
            });

            act(() => {
                result.current[1].undo();
            });

            expect(result.current[0]).toBe(1);
        });

        it('multiple undos work correctly', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].set(1);
                result.current[1].set(2);
                result.current[1].set(3);
            });

            act(() => {
                result.current[1].undo();
                result.current[1].undo();
            });

            expect(result.current[0]).toBe(1);
        });

        it('undo does nothing when no past state', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].undo();
            });

            expect(result.current[0]).toBe(0);
        });
    });

    describe('redo functionality', () => {
        it('canRedo is false initially', () => {
            const { result } = renderHook(() => useHistory(0));

            expect(result.current[1].canRedo).toBe(false);
        });

        it('canRedo is true after undo', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].set(1);
            });

            act(() => {
                result.current[1].undo();
            });

            expect(result.current[1].canRedo).toBe(true);
        });

        it('redo restores undone state', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].set(1);
            });

            act(() => {
                result.current[1].undo();
            });

            act(() => {
                result.current[1].redo();
            });

            expect(result.current[0]).toBe(1);
        });

        it('new set() clears future (redo history)', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].set(1);
                result.current[1].set(2);
            });

            act(() => {
                result.current[1].undo();
            });

            act(() => {
                result.current[1].set(99);
            });

            expect(result.current[1].canRedo).toBe(false);
        });
    });

    describe('reset functionality', () => {
        it('reset clears all history', () => {
            const { result } = renderHook(() => useHistory(0));

            act(() => {
                result.current[1].set(1);
                result.current[1].set(2);
            });

            act(() => {
                result.current[1].reset(100);
            });

            expect(result.current[0]).toBe(100);
            expect(result.current[1].canUndo).toBe(false);
            expect(result.current[1].canRedo).toBe(false);
        });
    });

    describe('history limit', () => {
        it('respects maxHistory limit', () => {
            const { result } = renderHook(() => useHistory(0, 3));

            act(() => {
                for (let i = 1; i <= 10; i++) {
                    result.current[1].set(i);
                }
            });

            // Should only be able to undo 3 times
            let undoCount = 0;
            while (result.current[1].canUndo) {
                act(() => {
                    result.current[1].undo();
                });
                undoCount++;
            }

            expect(undoCount).toBe(3);
        });
    });
});

describe('Map serialization utilities', () => {
    describe('serializeMap', () => {
        it('converts Map to object', () => {
            const map = new Map<string, number>([
                ['a', 1],
                ['b', 2],
            ]);
            const obj = serializeMap(map);

            expect(obj).toEqual({ a: 1, b: 2 });
        });

        it('handles empty Map', () => {
            const map = new Map<string, number>();
            const obj = serializeMap(map);

            expect(obj).toEqual({});
        });
    });

    describe('deserializeMap', () => {
        it('converts object to Map', () => {
            const obj = { a: 1, b: 2 };
            const map = deserializeMap(obj);

            expect(map.get('a')).toBe(1);
            expect(map.get('b')).toBe(2);
            expect(map.size).toBe(2);
        });

        it('handles empty object', () => {
            const obj = {};
            const map = deserializeMap(obj);

            expect(map.size).toBe(0);
        });
    });

    describe('round-trip serialization', () => {
        it('preserves data through serialize/deserialize', () => {
            const original = new Map<string, number>([
                ['x', 10],
                ['y', 20],
            ]);

            const serialized = serializeMap(original);
            const restored = deserializeMap(serialized);

            expect(restored.get('x')).toBe(10);
            expect(restored.get('y')).toBe(20);
        });
    });
});

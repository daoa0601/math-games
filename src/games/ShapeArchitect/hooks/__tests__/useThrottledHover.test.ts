import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottledHover } from '../useThrottledHover';
import type { Position3D } from '../../logic/types';

describe('useThrottledHover', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls handler immediately on first call', () => {
        const handler = vi.fn();
        const { result } = renderHook(() => useThrottledHover(handler, 50));

        act(() => {
            result.current({ x: 1, y: 1, z: 0 });
        });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({ x: 1, y: 1, z: 0 });
    });

    it('throttles rapid calls', () => {
        const handler = vi.fn();
        const { result } = renderHook(() => useThrottledHover(handler, 50));

        act(() => {
            result.current({ x: 1, y: 1, z: 0 });
            result.current({ x: 2, y: 2, z: 0 });
            result.current({ x: 3, y: 3, z: 0 });
        });

        // Only first call should be immediate
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({ x: 1, y: 1, z: 0 });
    });

    it('calls with last value after throttle period', () => {
        const handler = vi.fn();
        const { result } = renderHook(() => useThrottledHover(handler, 50));

        act(() => {
            result.current({ x: 1, y: 1, z: 0 });
            result.current({ x: 2, y: 2, z: 0 });
            result.current({ x: 3, y: 3, z: 0 });
        });

        // Advance past throttle period
        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(handler).toHaveBeenCalledTimes(2);
        expect(handler).toHaveBeenLastCalledWith({ x: 3, y: 3, z: 0 });
    });

    it('handles null position', () => {
        const handler = vi.fn();
        const { result } = renderHook(() => useThrottledHover(handler, 50));

        act(() => {
            result.current(null);
        });

        expect(handler).toHaveBeenCalledWith(null);
    });

    it('respects custom throttle interval', () => {
        const handler = vi.fn();
        const { result } = renderHook(() => useThrottledHover(handler, 100));

        act(() => {
            result.current({ x: 1, y: 1, z: 0 });
            result.current({ x: 2, y: 2, z: 0 });
        });

        // After 50ms, still throttled
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(handler).toHaveBeenCalledTimes(1);

        // After 100ms, should fire
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(handler).toHaveBeenCalledTimes(2);
    });

    it('cleans up pending timeout on unmount', () => {
        const handler = vi.fn();
        const { result, unmount } = renderHook(() => useThrottledHover(handler, 50));

        act(() => {
            result.current({ x: 1, y: 1, z: 0 });
            result.current({ x: 2, y: 2, z: 0 });
        });

        unmount();

        // Should not throw or call handler after unmount
        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(handler).toHaveBeenCalledTimes(1);
    });
});

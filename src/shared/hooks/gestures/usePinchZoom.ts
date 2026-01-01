import { useCallback, useRef, useEffect, type RefObject } from 'react';

export interface PinchEvent {
  /** Current scale factor relative to start */
  scale: number;
  /** Change in scale since last event */
  deltaScale: number;
  /** Center point of the pinch gesture */
  center: { x: number; y: number };
  /** Whether this is the final event (touch ended) */
  isFinal: boolean;
}

export interface UsePinchZoomOptions {
  /** Callback during pinch gesture */
  onPinch?: (event: PinchEvent) => void;
  /** Callback when pinch starts */
  onPinchStart?: (event: PinchEvent) => void;
  /** Callback when pinch ends */
  onPinchEnd?: (event: PinchEvent) => void;
  /** Minimum scale factor. Default: 0.5 */
  minScale?: number;
  /** Maximum scale factor. Default: 3 */
  maxScale?: number;
  /** Whether pinch is enabled. Default: true */
  enabled?: boolean;
}

export interface UsePinchZoomReturn {
  /** Ref to attach to the pinch target element */
  ref: RefObject<HTMLElement>;
  /** Current scale value */
  scale: number;
  /** Reset scale to 1 */
  resetScale: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
}

/**
 * Calculate distance between two touch points
 */
function getDistance(touch1: TouchPoint, touch2: TouchPoint): number {
  const dx = touch2.x - touch1.x;
  const dy = touch2.y - touch1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate center point between two touches
 */
function getCenter(touch1: TouchPoint, touch2: TouchPoint): TouchPoint {
  return {
    x: (touch1.x + touch2.x) / 2,
    y: (touch1.y + touch2.y) / 2,
  };
}

/**
 * usePinchZoom
 *
 * Detects two-finger pinch gestures for zooming.
 * Commonly used for 3D views and image viewers.
 *
 * @example
 * ```tsx
 * function ZoomableCanvas() {
 *   const { ref, scale } = usePinchZoom({
 *     onPinch: ({ scale }) => setZoom(scale),
 *     minScale: 0.5,
 *     maxScale: 4,
 *   });
 *
 *   return (
 *     <div ref={ref} style={{ transform: `scale(${scale})` }}>
 *       <canvas />
 *     </div>
 *   );
 * }
 * ```
 */
export function usePinchZoom(options: UsePinchZoomOptions = {}): UsePinchZoomReturn {
  const {
    onPinch,
    onPinchStart,
    onPinchEnd,
    minScale = 0.5,
    maxScale = 3,
    enabled = true,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const scaleRef = useRef(1);
  const initialDistanceRef = useRef<number | null>(null);
  const lastScaleRef = useRef(1);
  const isPinchingRef = useRef(false);

  /**
   * Clamp scale to min/max bounds
   */
  const clampScale = useCallback(
    (scale: number): number => {
      return Math.min(Math.max(scale, minScale), maxScale);
    },
    [minScale, maxScale]
  );

  /**
   * Reset scale to 1
   */
  const resetScale = useCallback(() => {
    scaleRef.current = 1;
    lastScaleRef.current = 1;
  }, []);

  /**
   * Handle touch start - detect two-finger touch
   */
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || e.touches.length !== 2) return;

      const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

      initialDistanceRef.current = getDistance(touch1, touch2);
      lastScaleRef.current = scaleRef.current;
      isPinchingRef.current = true;

      const center = getCenter(touch1, touch2);
      onPinchStart?.({
        scale: scaleRef.current,
        deltaScale: 0,
        center,
        isFinal: false,
      });
    },
    [enabled, onPinchStart]
  );

  /**
   * Handle touch move - calculate scale change
   */
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !isPinchingRef.current || e.touches.length !== 2) return;
      if (initialDistanceRef.current === null) return;

      // Prevent scrolling during pinch
      e.preventDefault();

      const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

      const currentDistance = getDistance(touch1, touch2);
      const scaleFactor = currentDistance / initialDistanceRef.current;
      const newScale = clampScale(lastScaleRef.current * scaleFactor);
      const deltaScale = newScale - scaleRef.current;

      scaleRef.current = newScale;

      const center = getCenter(touch1, touch2);
      onPinch?.({
        scale: newScale,
        deltaScale,
        center,
        isFinal: false,
      });
    },
    [enabled, clampScale, onPinch]
  );

  /**
   * Handle touch end - finalize pinch
   */
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!isPinchingRef.current) return;

      // If we still have 2 fingers, don't end pinch
      if (e.touches.length >= 2) return;

      isPinchingRef.current = false;
      initialDistanceRef.current = null;

      onPinchEnd?.({
        scale: scaleRef.current,
        deltaScale: 0,
        center: { x: 0, y: 0 },
        isFinal: true,
      });
    },
    [onPinchEnd]
  );

  /**
   * Attach event listeners
   */
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  /**
   * Get current scale value
   * Returns a callback to avoid reading ref during render
   */
  const getScale = useCallback(() => scaleRef.current, []);

  return {
    ref: ref as RefObject<HTMLElement>,
    scale: getScale(),
    resetScale,
  };
}

/**
 * usePinchZoomState
 *
 * Version with React state for scale (causes re-renders)
 * Use when you need reactive scale updates in the component
 */
export function usePinchZoomState(options: UsePinchZoomOptions = {}) {
  const { onPinch, ...rest } = options;
  const [scale, setScale] = useState(1);

  const handlePinch = useCallback(
    (event: PinchEvent) => {
      setScale(event.scale);
      onPinch?.(event);
    },
    [onPinch]
  );

  const result = usePinchZoom({
    ...rest,
    onPinch: handlePinch,
  });

  return {
    ...result,
    scale,
    setScale,
  };
}

// Import for usePinchZoomState
import { useState } from 'react';

export default usePinchZoom;

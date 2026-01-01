import { useCallback, useRef, useEffect, type RefObject } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipePosition {
  x: number;
  y: number;
  time: number;
}

export interface SwipeEvent {
  /** Direction of the swipe */
  direction: SwipeDirection;
  /** Horizontal distance traveled (positive = right) */
  deltaX: number;
  /** Vertical distance traveled (positive = down) */
  deltaY: number;
  /** Velocity in pixels per millisecond */
  velocity: number;
  /** Duration of swipe in milliseconds */
  duration: number;
}

export interface UseSwipeOptions {
  /** Callback when swipe is detected */
  onSwipe?: (event: SwipeEvent) => void;
  /** Callback for specific directions */
  onSwipeLeft?: (event: SwipeEvent) => void;
  onSwipeRight?: (event: SwipeEvent) => void;
  onSwipeUp?: (event: SwipeEvent) => void;
  onSwipeDown?: (event: SwipeEvent) => void;
  /** Minimum distance (in px) to trigger swipe. Default: 50 */
  threshold?: number;
  /** Minimum velocity to trigger swipe. Default: 0.3 px/ms */
  velocityThreshold?: number;
  /** Whether swipe is enabled. Default: true */
  enabled?: boolean;
  /** Prevent default on touch events. Default: false */
  preventDefault?: boolean;
}

export interface UseSwipeReturn {
  /** Ref to attach to the swipe target element */
  ref: RefObject<HTMLElement>;
  /** Touch event handlers (use if ref doesn't work with your component) */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

/**
 * useSwipe
 *
 * Detects swipe gestures on touch devices.
 * Supports all four directions with configurable thresholds.
 *
 * @example
 * ```tsx
 * function SwipeableCard() {
 *   const { ref } = useSwipe({
 *     onSwipeLeft: () => goToNext(),
 *     onSwipeRight: () => goToPrevious(),
 *     threshold: 50,
 *   });
 *
 *   return <div ref={ref}>Swipe me!</div>;
 * }
 * ```
 */
export function useSwipe(options: UseSwipeOptions = {}): UseSwipeReturn {
  const {
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
    enabled = true,
    preventDefault = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const startRef = useRef<SwipePosition | null>(null);
  const moveRef = useRef<SwipePosition | null>(null);

  /**
   * Calculate swipe direction from delta values
   */
  const getDirection = useCallback(
    (deltaX: number, deltaY: number): SwipeDirection => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        return deltaX > 0 ? 'right' : 'left';
      }
      return deltaY > 0 ? 'down' : 'up';
    },
    []
  );

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (!enabled) return;

      const touch = 'touches' in e ? e.touches[0] : (e as React.TouchEvent).touches[0];
      startRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      moveRef.current = null;
    },
    [enabled]
  );

  /**
   * Handle touch move - track for velocity calculation
   */
  const handleTouchMove = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (!enabled || !startRef.current) return;

      if (preventDefault) {
        e.preventDefault();
      }

      const touch = 'touches' in e ? e.touches[0] : (e as React.TouchEvent).touches[0];
      moveRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    },
    [enabled, preventDefault]
  );

  /**
   * Handle touch end - calculate and trigger swipe
   */
  const handleTouchEnd = useCallback(
    (_e: TouchEvent | React.TouchEvent) => {
      if (!enabled || !startRef.current) return;

      const end = moveRef.current || startRef.current;
      const deltaX = end.x - startRef.current.x;
      const deltaY = end.y - startRef.current.y;
      const duration = end.time - startRef.current.time;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / duration;

      // Reset refs
      startRef.current = null;
      moveRef.current = null;

      // Check if swipe meets threshold requirements
      const meetsDistanceThreshold = distance >= threshold;
      const meetsVelocityThreshold = velocity >= velocityThreshold;

      if (!meetsDistanceThreshold && !meetsVelocityThreshold) {
        return;
      }

      const direction = getDirection(deltaX, deltaY);
      const swipeEvent: SwipeEvent = {
        direction,
        deltaX,
        deltaY,
        velocity,
        duration,
      };

      // Call generic handler
      onSwipe?.(swipeEvent);

      // Call direction-specific handler
      switch (direction) {
        case 'left':
          onSwipeLeft?.(swipeEvent);
          break;
        case 'right':
          onSwipeRight?.(swipeEvent);
          break;
        case 'up':
          onSwipeUp?.(swipeEvent);
          break;
        case 'down':
          onSwipeDown?.(swipeEvent);
          break;
      }
    },
    [
      enabled,
      threshold,
      velocityThreshold,
      getDirection,
      onSwipe,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
    ]
  );

  /**
   * Attach event listeners to ref element
   */
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const options: AddEventListenerOptions = { passive: !preventDefault };

    element.addEventListener('touchstart', handleTouchStart as EventListener, options);
    element.addEventListener('touchmove', handleTouchMove as EventListener, options);
    element.addEventListener('touchend', handleTouchEnd as EventListener, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener);
      element.removeEventListener('touchmove', handleTouchMove as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [enabled, preventDefault, handleTouchStart, handleTouchMove, handleTouchEnd]);

  /**
   * React event handlers for manual attachment
   */
  const handlers = {
    onTouchStart: handleTouchStart as (e: React.TouchEvent) => void,
    onTouchMove: handleTouchMove as (e: React.TouchEvent) => void,
    onTouchEnd: handleTouchEnd as (e: React.TouchEvent) => void,
  };

  return { ref: ref as RefObject<HTMLElement>, handlers };
}

/**
 * useSwipeNavigation
 *
 * Preset for navigation-style swipes (left/right to go prev/next)
 *
 * @example
 * ```tsx
 * function Carousel({ items, currentIndex, onChange }) {
 *   const { ref } = useSwipeNavigation({
 *     onPrevious: () => onChange(currentIndex - 1),
 *     onNext: () => onChange(currentIndex + 1),
 *   });
 *
 *   return <div ref={ref}>{items[currentIndex]}</div>;
 * }
 * ```
 */
export function useSwipeNavigation(options: {
  onPrevious?: () => void;
  onNext?: () => void;
  threshold?: number;
  enabled?: boolean;
}): UseSwipeReturn {
  return useSwipe({
    onSwipeLeft: options.onNext,
    onSwipeRight: options.onPrevious,
    threshold: options.threshold,
    enabled: options.enabled,
  });
}

/**
 * useSwipeBack
 *
 * Preset for swipe-down-to-go-back pattern
 *
 * @example
 * ```tsx
 * function GamePage() {
 *   const navigate = useNavigate();
 *   const { ref } = useSwipeBack({
 *     onBack: () => navigate('/'),
 *     threshold: 100,
 *   });
 *
 *   return <div ref={ref}>Game content</div>;
 * }
 * ```
 */
export function useSwipeBack(options: {
  onBack: () => void;
  threshold?: number;
  enabled?: boolean;
}): UseSwipeReturn {
  return useSwipe({
    onSwipeDown: options.onBack,
    threshold: options.threshold ?? 100,
    enabled: options.enabled,
  });
}

export default useSwipe;

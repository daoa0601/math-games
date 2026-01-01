import { useCallback, useRef, useEffect, type RefObject } from 'react';

export interface UseDragScrollOptions {
  /** Direction(s) to allow scrolling. Default: 'both' */
  direction?: 'horizontal' | 'vertical' | 'both';
  /** Enable momentum scrolling after release. Default: true */
  momentum?: boolean;
  /** Momentum friction factor (0-1, higher = more friction). Default: 0.92 */
  friction?: number;
  /** Whether drag scroll is enabled. Default: true */
  enabled?: boolean;
  /** Callback when scrolling starts */
  onScrollStart?: () => void;
  /** Callback when scrolling ends */
  onScrollEnd?: () => void;
}

export interface UseDragScrollReturn {
  /** Ref to attach to the scrollable container */
  ref: RefObject<HTMLElement>;
  /** Whether currently scrolling */
  isScrolling: boolean;
}

interface DragState {
  isDown: boolean;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  velocityX: number;
  velocityY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
}

/**
 * useDragScroll
 *
 * Enables touch/mouse drag to scroll for containers.
 * Includes optional momentum (inertia) scrolling.
 *
 * @example
 * ```tsx
 * function HorizontalList({ items }) {
 *   const { ref } = useDragScroll({
 *     direction: 'horizontal',
 *     momentum: true,
 *   });
 *
 *   return (
 *     <div ref={ref} style={{ overflow: 'auto', whiteSpace: 'nowrap' }}>
 *       {items.map(item => <Card key={item.id} {...item} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDragScroll(options: UseDragScrollOptions = {}): UseDragScrollReturn {
  const {
    direction = 'both',
    momentum = true,
    friction = 0.92,
    enabled = true,
    onScrollStart,
    onScrollEnd,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const stateRef = useRef<DragState>({
    isDown: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    velocityX: 0,
    velocityY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
  });
  const isScrollingRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const applyMomentumRef = useRef<() => void>(() => {});

  /**
   * Check if horizontal scrolling is allowed
   */
  const allowHorizontal = direction === 'horizontal' || direction === 'both';

  /**
   * Check if vertical scrolling is allowed
   */
  const allowVertical = direction === 'vertical' || direction === 'both';

  /**
   * Handle pointer down (mouse or touch)
   */
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (!enabled || !ref.current) return;

      const element = ref.current;
      const state = stateRef.current;

      // Cancel any ongoing momentum animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      state.isDown = true;
      state.startX = e.pageX - element.offsetLeft;
      state.startY = e.pageY - element.offsetTop;
      state.scrollLeft = element.scrollLeft;
      state.scrollTop = element.scrollTop;
      state.velocityX = 0;
      state.velocityY = 0;
      state.lastX = e.pageX;
      state.lastY = e.pageY;
      state.lastTime = Date.now();

      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
    },
    [enabled]
  );

  /**
   * Handle pointer move
   */
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!enabled || !ref.current) return;

      const state = stateRef.current;
      if (!state.isDown) return;

      e.preventDefault();

      const element = ref.current;
      const now = Date.now();
      const dt = now - state.lastTime;

      if (dt > 0) {
        const x = e.pageX - element.offsetLeft;
        const y = e.pageY - element.offsetTop;

        // Calculate velocity for momentum
        state.velocityX = (e.pageX - state.lastX) / dt;
        state.velocityY = (e.pageY - state.lastY) / dt;

        state.lastX = e.pageX;
        state.lastY = e.pageY;
        state.lastTime = now;

        // Calculate scroll distance
        const walkX = (x - state.startX) * 1.5; // Multiply for faster scrolling
        const walkY = (y - state.startY) * 1.5;

        // Apply scroll
        if (allowHorizontal) {
          element.scrollLeft = state.scrollLeft - walkX;
        }
        if (allowVertical) {
          element.scrollTop = state.scrollTop - walkY;
        }

        // Trigger scroll start
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          onScrollStart?.();
        }
      }
    },
    [enabled, allowHorizontal, allowVertical, onScrollStart]
  );

  /**
   * Apply momentum scrolling
   */
  const applyMomentum = useCallback(() => {
    if (!ref.current) return;

    const element = ref.current;
    const state = stateRef.current;

    // Apply friction
    state.velocityX *= friction;
    state.velocityY *= friction;

    // Apply velocity to scroll
    if (allowHorizontal) {
      element.scrollLeft -= state.velocityX * 16; // ~60fps frame time
    }
    if (allowVertical) {
      element.scrollTop -= state.velocityY * 16;
    }

    // Continue animation if velocity is significant
    const speed = Math.abs(state.velocityX) + Math.abs(state.velocityY);
    if (speed > 0.01) {
      animationRef.current = requestAnimationFrame(applyMomentum);
    } else {
      isScrollingRef.current = false;
      onScrollEnd?.();
    }
  }, [friction, allowHorizontal, allowVertical, onScrollEnd]);

  /**
   * Handle pointer up
   */
  const handlePointerUp = useCallback(() => {
    if (!ref.current) return;

    const element = ref.current;
    const state = stateRef.current;

    if (!state.isDown) return;

    state.isDown = false;
    element.style.cursor = 'grab';
    element.style.removeProperty('user-select');

    // Start momentum scrolling
    if (momentum && (Math.abs(state.velocityX) > 0.1 || Math.abs(state.velocityY) > 0.1)) {
      animationRef.current = requestAnimationFrame(applyMomentum);
    } else {
      isScrollingRef.current = false;
      onScrollEnd?.();
    }
  }, [momentum, applyMomentum, onScrollEnd]);

  /**
   * Handle pointer leave
   */
  const handlePointerLeave = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  /**
   * Attach event listeners
   */
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.style.cursor = 'grab';

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointerleave', handlePointerLeave);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      element.style.removeProperty('cursor');
    };
  }, [enabled, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave]);

  return {
    ref: ref as RefObject<HTMLElement>,
    isScrolling: isScrollingRef.current,
  };
}

export default useDragScroll;

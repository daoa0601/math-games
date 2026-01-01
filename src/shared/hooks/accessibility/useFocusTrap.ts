import { useEffect, useRef, useCallback, type RefObject } from 'react';

/**
 * Focusable element selectors for trap
 * Matches all interactive elements that can receive focus
 */
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export interface UseFocusTrapOptions {
  /** External ref to use instead of creating one internally */
  containerRef?: RefObject<HTMLElement | null>;
  /** Callback when Escape key is pressed */
  onEscape?: () => void;
  /** Whether to auto-focus the first element on mount */
  autoFocus?: boolean;
  /** Whether to restore focus to previous element on unmount */
  restoreFocus?: boolean;
  /** Whether the trap is currently active */
  enabled?: boolean;
}

export interface UseFocusTrapReturn {
  /** Ref to attach to the trap container (only if not using external ref) */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * useFocusTrap
 *
 * Traps keyboard focus within a container element.
 * Essential for modal dialogs and overlays (WCAG 2.4.3).
 *
 * Features:
 * - Tab/Shift+Tab cycles through focusable elements
 * - Escape key handler for closing
 * - Auto-focus first element on mount
 * - Restores focus on unmount
 *
 * @example
 * ```tsx
 * function Modal({ onClose }) {
 *   const { containerRef } = useFocusTrap({
 *     onEscape: onClose,
 *     autoFocus: true,
 *     restoreFocus: true,
 *   });
 *
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <button>First</button>
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  const {
    containerRef: externalRef,
    onEscape,
    autoFocus = true,
    restoreFocus = true,
    enabled = true,
  } = options;

  const internalRef = useRef<HTMLDivElement>(null);
  // Use external ref if provided, otherwise use internal ref
  const containerRef = externalRef ?? internalRef;
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    return Array.from(elements).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }, [containerRef]);

  /**
   * Focus the first focusable element
   */
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  /**
   * Focus the last focusable element
   */
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  /**
   * Handle keydown events for trap logic
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;

      // Handle Escape key
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onEscape?.();
        return;
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        // Shift+Tab on first element -> focus last
        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab on last element -> focus first
        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
          return;
        }

        // If focus is outside container, bring it back
        if (!containerRef.current.contains(activeElement)) {
          event.preventDefault();
          event.shiftKey ? focusLast() : focusFirst();
        }
      }
    },
    [enabled, onEscape, getFocusableElements, focusFirst, focusLast, containerRef]
  );

  /**
   * Store previous focus and set up trap on mount
   */
  useEffect(() => {
    if (!enabled) return;

    // Store currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Auto-focus first element
    if (autoFocus) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        focusFirst();
      });
    }

    // Add keydown listener
    document.addEventListener('keydown', handleKeyDown, true);

    // Add body class for styling hooks
    document.body.classList.add('focus-trap-active');

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.classList.remove('focus-trap-active');

      // Restore focus on unmount
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [enabled, autoFocus, restoreFocus, handleKeyDown, focusFirst]);

  return { containerRef: internalRef };
}

/**
 * useFocusOnMount
 *
 * Simple hook to focus an element on mount.
 * Useful for auto-focusing inputs in forms.
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const inputRef = useFocusOnMount<HTMLInputElement>();
 *   return <input ref={inputRef} type="search" />;
 * }
 * ```
 */
export function useFocusOnMount<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  return ref;
}

export default useFocusTrap;

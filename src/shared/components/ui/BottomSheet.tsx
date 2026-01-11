/**
 * BottomSheet
 *
 * A unified modal/sheet component for overlays throughout the app.
 * Mobile: slides up from bottom with swipe-to-dismiss
 * Desktop: centered modal with backdrop click dismiss
 *
 * Patterns extracted from PlacementModal.tsx which works reliably.
 *
 * @example
 * <BottomSheet isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
 *   <DifficultySelector ... />
 * </BottomSheet>
 */

import { useRef, useCallback, useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/shared/hooks/accessibility';
import './BottomSheet.css';

const SWIPE_THRESHOLD = 100; // px to dismiss

export type BottomSheetDetent = 'content' | 'half' | 'full';

export interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Called when sheet should close */
  onClose: () => void;
  /** Optional title displayed in header */
  title?: string;
  /** Sheet content */
  children: ReactNode;
  /** Height behavior: 'content' (auto), 'half' (50vh), 'full' (90vh). Default: 'content' */
  detent?: BottomSheetDetent;
  /** Allow closing via backdrop/swipe/escape. Default: true */
  dismissible?: boolean;
  /** Additional CSS class */
  className?: string;
  /** ARIA label for accessibility (required if no title) */
  ariaLabel?: string;
  /** Render footer actions */
  footer?: ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  detent = 'content',
  dismissible = true,
  className = '',
  ariaLabel,
  footer,
}: BottomSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe-to-dismiss state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSwipeOffset(0);
      setTouchStart(null);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Focus trap and escape key handling
  useFocusTrap({
    containerRef,
    onEscape: dismissible ? onClose : undefined,
    enabled: isOpen,
    autoFocus: true,
    restoreFocus: true,
  });

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Touch handlers for swipe-to-dismiss (mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!dismissible) return;
    setTouchStart(e.touches[0].clientY);
  }, [dismissible]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart === null || !dismissible) return;

    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStart;

    // Only allow swiping down (positive delta)
    if (delta > 0) {
      setSwipeOffset(delta);
    }
  }, [touchStart, dismissible]);

  const handleTouchEnd = useCallback(() => {
    if (!dismissible) return;

    if (swipeOffset > SWIPE_THRESHOLD) {
      // Animate out then close
      setIsClosing(true);
      setTimeout(onClose, 200);
    }
    // Reset
    setSwipeOffset(0);
    setTouchStart(null);
  }, [swipeOffset, onClose, dismissible]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(() => {
    if (dismissible) {
      setIsClosing(true);
      setTimeout(onClose, 200);
    }
  }, [dismissible, onClose]);

  // Close button handler
  const handleCloseClick = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Prevent clicks inside card from closing
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  const detentClass = `bottom-sheet__card--${detent}`;
  const closingClass = isClosing ? 'bottom-sheet__card--closing' : '';

  const sheetContent = (
    <div
      className={`bottom-sheet ${className}`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className={`bottom-sheet__backdrop ${isClosing ? 'bottom-sheet__backdrop--closing' : ''}`}
        aria-hidden="true"
      />

      {/* Sheet Card */}
      <div
        ref={containerRef}
        className={`bottom-sheet__card ${detentClass} ${closingClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        aria-label={!title ? ariaLabel : undefined}
        onClick={handleCardClick}
        style={{
          transform: swipeOffset > 0 ? `translateY(${swipeOffset}px)` : undefined,
          transition: swipeOffset === 0 ? undefined : 'none',
        }}
      >
        {/* Drag handle for mobile swipe-to-dismiss */}
        <div
          className="bottom-sheet__drag-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-hidden="true"
        >
          <div className="bottom-sheet__drag-indicator" />
        </div>

        {/* Header */}
        {(title || dismissible) && (
          <header className="bottom-sheet__header">
            {title && (
              <h2 id="bottom-sheet-title" className="bottom-sheet__title">
                {title}
              </h2>
            )}
            {dismissible && (
              <button
                type="button"
                className="bottom-sheet__close"
                onClick={handleCloseClick}
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  aria-hidden="true"
                >
                  <path d="M15 5L5 15M5 5l10 10" />
                </svg>
              </button>
            )}
          </header>
        )}

        {/* Body */}
        <div className="bottom-sheet__body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <footer className="bottom-sheet__footer">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );

  // Portal to body to escape overflow issues
  return createPortal(sheetContent, document.body);
}

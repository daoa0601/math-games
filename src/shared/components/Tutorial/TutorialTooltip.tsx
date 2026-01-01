/**
 * Tutorial Tooltip Component
 *
 * A tooltip that attaches to highlighted elements during tutorials.
 * Supports positioning in 4 directions and includes navigation controls.
 */

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useTutorialContext } from './TutorialContext';
import { Button } from '@/shared/components/ui';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TutorialTooltipProps {
  /** Content to display in the tooltip */
  children: ReactNode;
  /** Position relative to the target element */
  position?: TooltipPosition;
  /** Show the Next/Finish button */
  showNext?: boolean;
  /** Show the Skip Tutorial button */
  showSkip?: boolean;
  /** Show the Previous/Back button */
  showPrevious?: boolean;
  /** CSS selector for the target element to position against */
  targetSelector?: string;
  /** Optional custom class name */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const TOOLTIP_PADDING = 12;
const VIEWPORT_MARGIN = 16;

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function calculateTooltipStyle(
  targetRect: DOMRect,
  tooltipRect: DOMRect,
  position: TooltipPosition,
  viewportWidth: number,
  viewportHeight: number
): CSSProperties {
  let top = 0;
  let left = 0;
  let transform = '';

  switch (position) {
    case 'bottom':
      top = targetRect.bottom + TOOLTIP_PADDING;
      left = targetRect.left + targetRect.width / 2;
      transform = 'translateX(-50%)';
      break;

    case 'top':
      top = targetRect.top - TOOLTIP_PADDING - tooltipRect.height;
      left = targetRect.left + targetRect.width / 2;
      transform = 'translateX(-50%)';
      break;

    case 'left':
      top = targetRect.top + targetRect.height / 2;
      left = targetRect.left - TOOLTIP_PADDING - tooltipRect.width;
      transform = 'translateY(-50%)';
      break;

    case 'right':
      top = targetRect.top + targetRect.height / 2;
      left = targetRect.right + TOOLTIP_PADDING;
      transform = 'translateY(-50%)';
      break;
  }

  // Clamp to viewport bounds
  const clampedLeft = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewportWidth - tooltipRect.width - VIEWPORT_MARGIN)
  );
  const clampedTop = Math.max(
    VIEWPORT_MARGIN,
    Math.min(top, viewportHeight - tooltipRect.height - VIEWPORT_MARGIN)
  );

  // Adjust transform if clamping occurred
  if (position === 'bottom' || position === 'top') {
    if (clampedLeft !== left) {
      transform = '';
    }
  } else {
    if (clampedTop !== top) {
      transform = '';
    }
  }

  return {
    position: 'fixed',
    top: clampedTop,
    left: clampedLeft,
    transform,
    zIndex: 'var(--z-tooltip)',
  };
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function TutorialTooltip({
  children,
  position = 'bottom',
  showNext = true,
  showSkip = true,
  showPrevious = false,
  targetSelector,
  className = '',
}: TutorialTooltipProps) {
  const { t } = useTranslation();
  const { next, previous, skip, currentStep, totalSteps, isActive } =
    useTutorialContext();

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [isPositioned, setIsPositioned] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // Position calculation
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isActive) {
      setIsPositioned(false);
      return;
    }

    const updatePosition = () => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      // If no target selector, center in viewport
      if (!targetSelector) {
        setTooltipStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 'var(--z-tooltip)',
        });
        setIsPositioned(true);
        return;
      }

      const target = document.querySelector(targetSelector);
      if (!target) {
        // Fallback to centered if target not found
        setTooltipStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 'var(--z-tooltip)',
        });
        setIsPositioned(true);
        return;
      }

      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const style = calculateTooltipStyle(
        targetRect,
        tooltipRect,
        position,
        viewportWidth,
        viewportHeight
      );

      setTooltipStyle(style);
      setIsPositioned(true);
    };

    // Initial position
    // Use RAF to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      updatePosition();
    });

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [targetSelector, position, isActive, currentStep]);

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  if (!isActive) return null;

  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <div
      ref={tooltipRef}
      className={`tutorial-tooltip tutorial-tooltip--${position} ${className}`.trim()}
      style={{
        ...tooltipStyle,
        opacity: isPositioned ? 1 : 0,
        visibility: isPositioned ? 'visible' : 'hidden',
      }}
      role="dialog"
      aria-modal="false"
      aria-label={t('tutorial.stepOf', { current: currentStep, total: totalSteps })}
    >
      {/* Arrow indicator */}
      <div className={`tutorial-tooltip__arrow tutorial-tooltip__arrow--${position}`} />

      {/* Content */}
      <div className="tutorial-tooltip__content">{children}</div>

      {/* Progress indicator */}
      <div className="tutorial-tooltip__progress" aria-live="polite">
        {t('tutorial.stepOf', { current: currentStep, total: totalSteps })}
      </div>

      {/* Navigation buttons */}
      <div className="tutorial-tooltip__actions">
        {showPrevious && !isFirstStep && (
          <Button variant="ghost" size="small" onClick={previous}>
            {t('tutorial.previous')}
          </Button>
        )}

        {showSkip && (
          <Button variant="ghost" size="small" onClick={skip}>
            {t('tutorial.skip')}
          </Button>
        )}

        {showNext && (
          <Button variant="primary" size="small" onClick={next}>
            {isLastStep ? t('tutorial.finish') : t('tutorial.next')}
          </Button>
        )}
      </div>
    </div>
  );
}

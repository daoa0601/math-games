/**
 * Tutorial Step Component
 *
 * Conditionally renders children only when the current tutorial step
 * matches the step prop. Also manages element highlighting for the step.
 *
 * @example
 * ```tsx
 * <Tutorial totalSteps={3}>
 *   <TutorialStep step={1} highlightSelector="#game-board">
 *     <TutorialTooltip>Click here to start the game</TutorialTooltip>
 *   </TutorialStep>
 *   <TutorialStep step={2} highlightSelector=".score-display">
 *     <TutorialTooltip>This shows your score</TutorialTooltip>
 *   </TutorialStep>
 *   <TutorialStep step={3}>
 *     <TutorialTooltip>You're ready to play!</TutorialTooltip>
 *   </TutorialStep>
 * </Tutorial>
 * ```
 */

import { ReactNode, useEffect } from 'react';
import { useTutorialContext } from './TutorialContext';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface TutorialStepProps {
  /** The step number this component should render on (1-based) */
  step: number;
  /** CSS selector for the element to highlight during this step */
  highlightSelector?: string;
  /** Content to render when this step is active */
  children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function TutorialStep({
  step,
  highlightSelector,
  children,
}: TutorialStepProps) {
  const { currentStep, setHighlightedElement } = useTutorialContext();

  const isCurrentStep = currentStep === step;

  useEffect(() => {
    if (isCurrentStep && highlightSelector) {
      setHighlightedElement(highlightSelector);
      return () => setHighlightedElement(null);
    }
  }, [isCurrentStep, highlightSelector, setHighlightedElement]);

  if (!isCurrentStep) return null;

  return <>{children}</>;
}

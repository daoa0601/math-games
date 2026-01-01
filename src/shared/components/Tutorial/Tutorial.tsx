import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useTutorial } from '../../hooks/useTutorial';
import { TutorialContext } from './TutorialContext';
import './Tutorial.css';

interface TutorialProps {
  children: ReactNode;
  totalSteps: number;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export function Tutorial({
  children,
  totalSteps,
  onComplete,
  onSkip,
  autoStart = true
}: TutorialProps) {
  const tutorial = useTutorial({ totalSteps, onComplete, onSkip });
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);

  // Auto-start the tutorial
  useEffect(() => {
    if (autoStart && tutorial.isIdle) {
      tutorial.start();
    }
  }, [autoStart, tutorial]);

  const contextValue = useMemo(
    () => ({ ...tutorial, highlightedElement, setHighlightedElement }),
    [tutorial, highlightedElement]
  );

  return (
    <TutorialContext.Provider value={contextValue}>
      <div className="tutorial-container" data-active={tutorial.isActive}>
        {children}
      </div>
    </TutorialContext.Provider>
  );
}

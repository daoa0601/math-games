import { createContext, useContext } from 'react';
import { useTutorial } from '../../hooks/useTutorial';

type TutorialContextValue = ReturnType<typeof useTutorial> & {
  highlightedElement: string | null;
  setHighlightedElement: (selector: string | null) => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorialContext() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialContext must be used within Tutorial');
  }
  return context;
}

export { TutorialContext };

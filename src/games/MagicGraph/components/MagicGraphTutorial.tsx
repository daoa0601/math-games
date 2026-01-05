/**
 * MagicGraph Tutorial Component
 *
 * Interactive tutorial that guides new players through the Magic Graph game mechanics.
 * Uses the shared Tutorial system with game-specific steps and highlights.
 */

import { useTranslation } from 'react-i18next';
import {
  Tutorial,
  TutorialStep,
  TutorialTooltip,
  TutorialSpotlight,
} from '@/shared/components/Tutorial';
import {
  markTutorialCompleted,
  markTutorialSkipped,
} from '@/shared/services/tutorialProgress';

interface MagicGraphTutorialProps {
  onComplete: () => void;
}

const GAME_ID = 'magic-graph';
const TOTAL_STEPS = 5;

export function MagicGraphTutorial({ onComplete }: MagicGraphTutorialProps) {
  const { t } = useTranslation();

  const handleComplete = () => {
    markTutorialCompleted(GAME_ID);
    onComplete();
  };

  const handleSkip = () => {
    markTutorialSkipped(GAME_ID);
    onComplete();
  };

  return (
    <Tutorial totalSteps={TOTAL_STEPS} onComplete={handleComplete} onSkip={handleSkip}>
      <TutorialSpotlight />

      {/* Step 1: Welcome - highlight the game info section with target sum */}
      <TutorialStep step={1} highlightSelector=".game-info">
        <TutorialTooltip position="bottom" targetSelector=".game-info">
          <h3>{t('magicGraph.tutorial.step1Title')}</h3>
          <p>{t('magicGraph.tutorial.step1')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 2: Fixed Numbers - highlight fixed nodes (golden stars) */}
      <TutorialStep step={2} highlightSelector=".mg-node--fixed">
        <TutorialTooltip position="right" targetSelector=".mg-node--fixed">
          <h3>{t('magicGraph.tutorial.step2Title')}</h3>
          <p>{t('magicGraph.tutorial.step2')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 3: Placing Numbers - highlight empty nodes */}
      <TutorialStep step={3} highlightSelector=".mg-node--empty">
        <TutorialTooltip position="right" targetSelector=".mg-node--empty">
          <h3>{t('magicGraph.tutorial.step3Title')}</h3>
          <p>{t('magicGraph.tutorial.step3')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 4: Check Your Work - highlight the puzzle board lines */}
      <TutorialStep step={4} highlightSelector=".mg-board">
        <TutorialTooltip position="bottom" targetSelector=".mg-board">
          <h3>{t('magicGraph.tutorial.step4Title')}</h3>
          <p>{t('magicGraph.tutorial.step4')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 5: Need Help? - highlight the action buttons (undo/redo/reset) */}
      <TutorialStep step={5} highlightSelector=".mg-actions">
        <TutorialTooltip position="top" targetSelector=".mg-actions">
          <h3>{t('magicGraph.tutorial.step5Title')}</h3>
          <p>{t('magicGraph.tutorial.step5')}</p>
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  );
}

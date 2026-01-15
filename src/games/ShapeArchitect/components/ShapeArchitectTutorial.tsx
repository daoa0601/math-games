/**
 * ShapeArchitect Tutorial Component
 *
 * Interactive tutorial that guides new players through the Shape Architect game mechanics.
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

interface ShapeArchitectTutorialProps {
  onComplete: () => void;
}

const GAME_ID = 'shape-architect';
const TOTAL_STEPS = 5;

export function ShapeArchitectTutorial({ onComplete }: ShapeArchitectTutorialProps) {
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

      {/* Step 1: Welcome - general introduction, no specific highlight */}
      <TutorialStep step={1}>
        <TutorialTooltip position="bottom" showPrevious={false}>
          <h3>{t('shapeArchitect.tutorial.step1Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step1')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 2: Target Shape - highlight the grid board with target cells */}
      <TutorialStep step={2} highlightSelector=".sa-board">
        <TutorialTooltip
          position="bottom"
          targetSelector=".sa-board"
          showPrevious
        >
          <h3>{t('shapeArchitect.tutorial.step2Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step2')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 3: Your Pieces - highlight the piece inventory */}
      <TutorialStep step={3} highlightSelector=".sa-inventory">
        <TutorialTooltip position="top" targetSelector=".sa-inventory" showPrevious>
          <h3>{t('shapeArchitect.tutorial.step3Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step3')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 4: Rotating Pieces - highlight rotation controls */}
      <TutorialStep step={4} highlightSelector=".sa-rotation">
        <TutorialTooltip position="bottom" targetSelector=".sa-rotation" showPrevious>
          <h3>{t('shapeArchitect.tutorial.step4Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step4')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 5: Placing Pieces - highlight target cells on the grid */}
      <TutorialStep step={5} highlightSelector=".sa-cell--target">
        <TutorialTooltip position="right" targetSelector=".sa-cell--target" showPrevious>
          <h3>{t('shapeArchitect.tutorial.step5Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step5')}</p>
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  );
}

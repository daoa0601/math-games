/**
 * ShapeArchitect Tutorial Component
 *
 * Interactive tutorial that guides new players through the Shape Architect game mechanics.
 * Uses the shared Tutorial system with game-specific steps and highlights.
 * Supports both 2D and 3D modes with conditional step display.
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
  is3DMode: boolean;
}

const GAME_ID = 'shape-architect';

export function ShapeArchitectTutorial({ onComplete, is3DMode }: ShapeArchitectTutorialProps) {
  const { t } = useTranslation();

  // 3D mode has 6 steps, 2D mode has 5 steps
  const totalSteps = is3DMode ? 6 : 5;

  const handleComplete = () => {
    markTutorialCompleted(GAME_ID);
    onComplete();
  };

  const handleSkip = () => {
    markTutorialSkipped(GAME_ID);
    onComplete();
  };

  return (
    <Tutorial totalSteps={totalSteps} onComplete={handleComplete} onSkip={handleSkip}>
      <TutorialSpotlight />

      {/* Step 1: Welcome - general introduction, no specific highlight */}
      <TutorialStep step={1}>
        <TutorialTooltip position="bottom" showPrevious={false}>
          <h3>{t('shapeArchitect.tutorial.step1Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step1')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 2: Target Shape - highlight the grid board with target cells */}
      <TutorialStep step={2} highlightSelector={is3DMode ? '.grid-board-3d' : '.grid-board'}>
        <TutorialTooltip
          position="bottom"
          targetSelector={is3DMode ? '.grid-board-3d' : '.grid-board'}
          showPrevious
        >
          <h3>{t('shapeArchitect.tutorial.step2Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step2')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 3: Your Pieces - highlight the piece inventory */}
      <TutorialStep step={3} highlightSelector=".piece-inventory">
        <TutorialTooltip position="top" targetSelector=".piece-inventory" showPrevious>
          <h3>{t('shapeArchitect.tutorial.step3Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step3')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 4: Rotating Pieces - highlight rotation controls */}
      <TutorialStep step={4} highlightSelector=".rotation-controls">
        <TutorialTooltip position="bottom" targetSelector=".rotation-controls" showPrevious>
          <h3>{t('shapeArchitect.tutorial.step4Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step4')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 5: Placing Pieces - highlight target cells on the grid */}
      <TutorialStep step={5} highlightSelector=".grid-cell--target">
        <TutorialTooltip position="right" targetSelector=".grid-cell--target" showPrevious>
          <h3>{t('shapeArchitect.tutorial.step5Title')}</h3>
          <p>{t('shapeArchitect.tutorial.step5')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 6: 3D Mode - only shown when in 3D mode, highlight camera presets */}
      {is3DMode && (
        <TutorialStep step={6} highlightSelector=".camera-presets">
          <TutorialTooltip position="bottom" targetSelector=".camera-presets" showPrevious>
            <h3>{t('shapeArchitect.tutorial.step6Title')}</h3>
            <p>{t('shapeArchitect.tutorial.step6')}</p>
          </TutorialTooltip>
        </TutorialStep>
      )}
    </Tutorial>
  );
}

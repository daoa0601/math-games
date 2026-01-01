/**
 * SequenceRace Tutorial Component
 *
 * Interactive tutorial that guides new players through the Sequence Race game mechanics.
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

interface SequenceRaceTutorialProps {
  onComplete: () => void;
}

const GAME_ID = 'sequence-race';
const TOTAL_STEPS = 5;

export function SequenceRaceTutorial({ onComplete }: SequenceRaceTutorialProps) {
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

      {/* Step 1: Welcome - highlight the game info panel with target */}
      <TutorialStep step={1} highlightSelector=".game-info-panel">
        <TutorialTooltip position="bottom" targetSelector=".game-info-panel">
          <h3>{t('sequenceRace.tutorial.step1Title')}</h3>
          <p>{t('sequenceRace.tutorial.step1')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 2: The Track - highlight the race track area */}
      <TutorialStep step={2} highlightSelector=".race-track">
        <TutorialTooltip position="bottom" targetSelector=".race-track">
          <h3>{t('sequenceRace.tutorial.step2Title')}</h3>
          <p>{t('sequenceRace.tutorial.step2')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 3: Making Moves - highlight the step cards */}
      <TutorialStep step={3} highlightSelector=".step-cards">
        <TutorialTooltip position="top" targetSelector=".step-cards">
          <h3>{t('sequenceRace.tutorial.step3Title')}</h3>
          <p>{t('sequenceRace.tutorial.step3')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 4: Taking Turns - highlight the turn indicator */}
      <TutorialStep step={4} highlightSelector=".turn-indicator">
        <TutorialTooltip position="bottom" targetSelector=".turn-indicator">
          <h3>{t('sequenceRace.tutorial.step4Title')}</h3>
          <p>{t('sequenceRace.tutorial.step4')}</p>
        </TutorialTooltip>
      </TutorialStep>

      {/* Step 5: Winning - highlight the finish line flag */}
      <TutorialStep step={5} highlightSelector=".target-flag">
        <TutorialTooltip position="left" targetSelector=".target-flag">
          <h3>{t('sequenceRace.tutorial.step5Title')}</h3>
          <p>{t('sequenceRace.tutorial.step5')}</p>
        </TutorialTooltip>
      </TutorialStep>
    </Tutorial>
  );
}

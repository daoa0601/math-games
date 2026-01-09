/**
 * useGameInit Hook
 *
 * Consolidates common game initialization patterns shared across all games:
 * - Daily mode detection from URL params
 * - Daily completion state
 * - Tutorial visibility state
 * - Practice mode sync with player preferences
 * - Standard time warning callback for screen reader announcements
 *
 * This hook reduces ~60-80 lines of duplicated code per game component.
 *
 * @example
 * ```tsx
 * const {
 *   isDailyMode,
 *   dailyCompleted,
 *   setDailyCompleted,
 *   showTutorial,
 *   setShowTutorial,
 *   practiceMode,
 *   setPracticeMode,
 *   handleTimeWarning,
 *   handlePracticeModeChange,
 * } = useGameInit({ gameId: 'magic-graph' });
 *
 * // Use with useGameTimer
 * const timer = useGameTimer({
 *   isGameOver: showWin,
 *   practiceMode,
 *   onTimeWarning: handleTimeWarning,
 * });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/shared/contexts';
import { useAnnounce } from '@/shared/hooks/accessibility';
import { isDailyCompleted as checkDailyCompleted } from '@/shared/services/daily';
import { shouldShowTutorial } from '@/shared/services/tutorialProgress';
import type { StorageGameId } from '@/shared/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UseGameInitOptions {
  /** The game ID for this game instance */
  gameId: StorageGameId;
}

export interface UseGameInitReturn {
  /** Whether the game was launched in daily challenge mode */
  isDailyMode: boolean;
  /** Whether the daily challenge has been completed */
  dailyCompleted: boolean;
  /** Set daily completion state */
  setDailyCompleted: (completed: boolean) => void;
  /** Whether the tutorial should be shown */
  showTutorial: boolean;
  /** Set tutorial visibility */
  setShowTutorial: (show: boolean) => void;
  /** Whether practice mode is enabled */
  practiceMode: boolean;
  /** Set practice mode state */
  setPracticeMode: (practice: boolean) => void;
  /** Handle practice mode toggle (also updates player preferences) */
  handlePracticeModeChange: (newPracticeMode: boolean) => void;
  /** Standard time warning callback for screen reader announcements */
  handleTimeWarning: (secondsRemaining: number) => void;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useGameInit({ gameId }: UseGameInitOptions): UseGameInitReturn {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const { profile, updatePreferences } = usePlayer();
  const { announce } = useAnnounce();

  // ─────────────────────────────────────────────────────────────────
  // Daily Mode Detection
  // ─────────────────────────────────────────────────────────────────

  const isDailyMode = searchParams.get('daily') === 'true';
  const [dailyCompleted, setDailyCompleted] = useState(() =>
    isDailyMode && checkDailyCompleted(gameId)
  );

  // ─────────────────────────────────────────────────────────────────
  // Tutorial State
  // ─────────────────────────────────────────────────────────────────

  const [showTutorial, setShowTutorial] = useState(() =>
    shouldShowTutorial(gameId)
  );

  // ─────────────────────────────────────────────────────────────────
  // Practice Mode
  // ─────────────────────────────────────────────────────────────────

  const [practiceMode, setPracticeMode] = useState(
    profile.preferences.practiceMode
  );

  const handlePracticeModeChange = useCallback(
    (newPracticeMode: boolean) => {
      setPracticeMode(newPracticeMode);
      updatePreferences({ practiceMode: newPracticeMode });
    },
    [updatePreferences]
  );

  // ─────────────────────────────────────────────────────────────────
  // Time Warning Callback
  // ─────────────────────────────────────────────────────────────────

  const handleTimeWarning = useCallback(
    (secondsRemaining: number) => {
      if (secondsRemaining === 30) {
        announce(t('timer.warning30', '30 seconds remaining'), 'polite');
      } else if (secondsRemaining === 10) {
        announce(t('timer.warning10', '10 seconds remaining! Hurry!'), 'assertive');
      }
    },
    [announce, t]
  );

  // Memoize return value to prevent creating new object reference on every render
  return useMemo(() => ({
    isDailyMode,
    dailyCompleted,
    setDailyCompleted,
    showTutorial,
    setShowTutorial,
    practiceMode,
    setPracticeMode,
    handlePracticeModeChange,
    handleTimeWarning,
  }), [
    isDailyMode,
    dailyCompleted,
    showTutorial,
    practiceMode,
    handlePracticeModeChange,
    handleTimeWarning,
  ]);
}

export default useGameInit;

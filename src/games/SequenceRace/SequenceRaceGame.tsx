/**
 * SequenceRace Game
 *
 * Turn-based strategy game where players race to reach a target number
 * using arithmetic sequences. Features AI opponent with minimax algorithm.
 *
 * Refactored to use extracted hooks for better separation of concerns.
 * Original: 519 lines → Refactored: ~350 lines
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GameLayout,
  DifficultySelector,
  RankUpOverlay,
  AchievementToast,
  Timer,
  SoundToggle,
  VictoryModal,
  HelpButton,
  SettingsDrawer,
  SettingsDrawerTrigger,
  SettingsSection,
} from '@/shared/components';
import { useGameTimer, useGameRewards, useGameInit, useAnnounce } from '@/shared/hooks';
import { playSound, showConfetti } from '@/shared/utils';
import { completeDailyChallenge } from '@/shared/services/daily';
import { RaceTrack, StepCards, HistoryLog, SequenceInfoBadge, SequenceRaceTutorial } from './components';
import { useSequenceRaceState, useAIOpponent, useHintSystem } from './hooks';
import { applyMove, isHumanTurn } from './logic/engine';
import { getDailySequenceRaceConfig } from './logic/seededGenerator';
import '@/shared/styles/game-base.css';
import './SequenceRace.css';

export function SequenceRaceGame() {
  const { t } = useTranslation('sequenceRace');
  const { t: tc } = useTranslation('common');

  // ─────────────────────────────────────────────────────────────────
  // Game Initialization (consolidated hook)
  // ─────────────────────────────────────────────────────────────────

const {
    isDailyMode,
    dailyCompleted,
    setDailyCompleted,
    showTutorial,
    setShowTutorial,
    practiceMode,
    handlePracticeModeChange,
    handleTimeWarning,
  } = useGameInit({ gameId: 'sequence-race' });

  // Daily config for seeded puzzle generation (computed once per mode)
  const dailyConfig = useMemo(
    () => isDailyMode ? getDailySequenceRaceConfig() : undefined,
    [isDailyMode]
  );

  // Screen reader announcements for game events
  const { announce } = useAnnounce();

  // ─────────────────────────────────────────────────────────────────
  // Rewards
  // ─────────────────────────────────────────────────────────────────

  const {
    handleCompletion,
    rewards,
    showingRankUp,
    setShowingRankUp,
    toastQueue,
    dismissToast,
  } = useGameRewards();

  // ─────────────────────────────────────────────────────────────────
  // Timer
  // ─────────────────────────────────────────────────────────────────

  // Track game over state for timer - needs to be declared before useGameTimer
  const [isGameOver, setIsGameOver] = useState(false);

  const {
    timeLeft,
    showTimeUp,
    timerClass,
    formattedTime,
    elapsedTime,
    isPracticeMode,
    isPaused,
    resetTimer,
    pauseTimer,
    resumeTimer,
  } = useGameTimer({
    isGameOver,
    practiceMode,
    onTimeWarning: handleTimeWarning,
  });

  // ─────────────────────────────────────────────────────────────────
  // Game State (extracted hook)
  // ─────────────────────────────────────────────────────────────────

  const {
    difficulty,
    gameMode,
    currentConfig,
    gameState,
    validMoves,
    analysis,
    sequenceInfo,
    canUndo,
    setGameState,
    startRandomGame,
    restartGame,
    handleDifficultyChange,
    handleModeChange: handleModeChangeBase,
    undoLastMove,
  } = useSequenceRaceState({
    onResetTimer: resetTimer,
    initialConfig: dailyConfig,
  });

  // Sync isGameOver state with gameState.gameOver
  // This pattern is required because useGameTimer expects a boolean prop,
  // while gameState comes from a separate hook (useSequenceRaceState)
  useEffect(() => {
    setIsGameOver(gameState.gameOver); // eslint-disable-line react-hooks/set-state-in-effect
  }, [gameState.gameOver]);

  // ─────────────────────────────────────────────────────────────────
  // Hint System (extracted hook)
  // ─────────────────────────────────────────────────────────────────

  const { showHints, teacherHint, toggleHints, analyzeMove, clearHints } = useHintSystem({
    gameMode,
  });

  // Wrap mode change to clear hints
  const handleModeChange = useCallback(
    (newMode: 'vs-ai' | 'two-player') => {
      handleModeChangeBase(newMode);
      clearHints();
    },
    [handleModeChangeBase, clearHints]
  );

  // ─────────────────────────────────────────────────────────────────
  // AI Opponent (extracted hook)
  // ─────────────────────────────────────────────────────────────────

  const { isAIThinking, aiReaction } = useAIOpponent({
    gameState,
    gameMode,
    difficulty,
    showTimeUp,
    aiMovesFirst: currentConfig.aiMovesFirst,
    onAIMove: setGameState,
  });

  // ─────────────────────────────────────────────────────────────────
  // Move Preview (ghost marker on hover)
  // ─────────────────────────────────────────────────────────────────

  const [previewPosition, setPreviewPosition] = useState<number | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // Settings Drawer (Progressive Disclosure)
  // ─────────────────────────────────────────────────────────────────

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // Turn and Game State Announcements
  // ─────────────────────────────────────────────────────────────────

  const prevTurnRef = useRef(gameState.turn);
  const prevHistoryLengthRef = useRef(gameState.history.length);

  // Turn change announcements
  useEffect(() => {
    if (gameState.turn !== prevTurnRef.current) {
      prevTurnRef.current = gameState.turn;

      if (gameState.turn === 'player') {
        announce(
          tc('announcements.yourTurn', {
            position: gameState.currentPosition,
            target: gameState.target,
          }),
          'polite'
        );
      } else if (gameState.turn === 'ai') {
        announce(tc('announcements.aiTurn'), 'polite');
      }
    }
  }, [gameState.turn, gameState.currentPosition, gameState.target, announce, tc]);

  // AI move announcements
  useEffect(() => {
    const currentLength = gameState.history.length;
    if (currentLength > prevHistoryLengthRef.current) {
      const lastMove = gameState.history[currentLength - 1];
      if (lastMove && lastMove.actor === 'ai') {
        announce(
          tc('announcements.aiMoved', {
            steps: lastMove.step,
            position: lastMove.position,
          }),
          'polite'
        );
      }
    }
    prevHistoryLengthRef.current = currentLength;
  }, [gameState.history, announce, tc]);

  // Win/loss announcements
  useEffect(() => {
    if (gameState.winner === 'player') {
      announce(
        tc('announcements.youWin', {
          target: gameState.target,
          moves: gameState.history.length,
        }),
        'assertive'
      );
    } else if (gameState.winner === 'ai') {
      announce(tc('announcements.aiWins'), 'assertive');
    }
  }, [gameState.winner, gameState.target, gameState.history.length, announce, tc]);

  // ─────────────────────────────────────────────────────────────────
  // Player Move Handler
  // ─────────────────────────────────────────────────────────────────

  const handlePlayerMove = useCallback(
    (step: number) => {
      if (!isHumanTurn(gameState) || gameState.gameOver || showTimeUp) return;

      // Analyze move for hints before applying
      analyzeMove(gameState, step);

      playSound('click');
      const newState = applyMove(gameState, step);
      setGameState(newState);
    },
    [gameState, showTimeUp, analyzeMove, setGameState]
  );

  // ─────────────────────────────────────────────────────────────────
  // Win Celebration Effect (runs once when game ends)
  // ─────────────────────────────────────────────────────────────────

  // Use ref to capture elapsed time at win moment (avoids re-triggering on timer ticks)
  const winTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState.gameOver && gameState.winner === 'player' && winTimeRef.current === null) {
      // Capture the time at win
      winTimeRef.current = elapsedTime;

      handleCompletion({
        gameId: 'sequence-race',
        levelId: isDailyMode ? 'daily' : currentConfig.id,
        difficulty,
        timeSeconds: elapsedTime,
        practiceMode: isPracticeMode,
        wasWinner: true,
        isOptimalSolution: analysis?.canWin ?? false,
      });

      // Track daily challenge completion - setState needed for UI update
      if (isDailyMode && !dailyCompleted) {
        completeDailyChallenge('sequence-race', elapsedTime);
        setDailyCompleted(true);
      }

      playSound('win');
      showConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    // Reset the ref when game restarts
    if (!gameState.gameOver) {
      winTimeRef.current = null;
    }
  }, [
    gameState.gameOver,
    gameState.winner,
    currentConfig.id,
    difficulty,
    elapsedTime,
    isPracticeMode,
    analysis,
    handleCompletion,
    isDailyMode,
    dailyCompleted,
    setDailyCompleted,
  ]);

  // ─────────────────────────────────────────────────────────────────
  // Label Helpers
  // ─────────────────────────────────────────────────────────────────

  const getSequenceName = (type: string) => t(`sequences.${type}.name`);
  const getSequenceDescription = (type: string) => t(`sequences.${type}.description`);

  const turnLabel = useMemo(() => {
    if (gameMode === 'two-player') {
      return gameState.turn === 'player1' ? `🧑 ${t('player1')}` : `🧑 ${t('player2')}`;
    }
    return gameState.turn === 'player' ? `🧑 ${t('you')}` : `🤖 ${t('ai')}`;
  }, [gameMode, gameState.turn, t]);

  const getWinnerLabel = () => {
    if (!gameState.winner) return '';
    if (gameMode === 'two-player') {
      return gameState.winner === 'player1' ? t('gameOver.player1Wins') : t('gameOver.player2Wins');
    }
    return gameState.winner === 'player' ? t('gameOver.youWin') : t('gameOver.aiWins');
  };

  const isPlayerWin =
    gameMode === 'two-player'
      ? gameState.winner === 'player1' || gameState.winner === 'player2'
      : gameState.winner === 'player';

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  return (
    <GameLayout
      title={t('title')}
      gameId="sequence-race"
      headerRight={
        <>
          <HelpButton gameId="sequence-race" onShowTutorial={() => setShowTutorial(true)} />
          <SoundToggle />
          {!isDailyMode && <SettingsDrawerTrigger onClick={() => setIsSettingsOpen(true)} />}
        </>
      }
    >
      <div className="sr-container sr-layout">
        {/* === MAIN AREA: Track and gameplay === */}
        <div className="sr-main">
          {/* Daily Challenge Badge */}
          {isDailyMode && (
            <div className="daily-badge">
              <span className="daily-badge__icon">📅</span>
              <span className="daily-badge__text">{tc('daily.dailyChallenge')}</span>
              {dailyCompleted && <span className="daily-badge__check">✓</span>}
            </div>
          )}

          {/* Sequence Info */}
          <SequenceInfoBadge sequenceType={currentConfig.sequenceType || 'arithmetic'} />

          {/* Race Track */}
          <RaceTrack
            state={gameState}
            gameMode={gameMode}
            isAIThinking={isAIThinking}
            aiReaction={aiReaction}
            previewPosition={previewPosition}
            isUrgent={!isPracticeMode && timeLeft <= 10}
          />

          {/* AI First Move Banner */}
          {currentConfig.aiMovesFirst && gameState.history.length === 0 && gameState.turn === 'ai' && (
            <div className="sr-ai-first">
              <span>🎯</span>
              <span className="sr-ai-first__text">{t('aiMovesFirst', 'The opponent moves first this round!')}</span>
            </div>
          )}

          {/* Turn Indicator */}
          {!gameState.gameOver && !showTimeUp && (
            <div className={`sr-turn sr-turn--${gameState.turn}`}>
              {gameMode === 'two-player'
                ? gameState.turn === 'player1'
                  ? t('player1Turn')
                  : t('player2Turn')
                : gameState.turn === 'player'
                  ? t('yourTurn')
                  : isAIThinking
                    ? t('aiThinking')
                    : t('aiTurn')}
            </div>
          )}

          {/* Step Cards */}
          <StepCards
            availableSteps={currentConfig.stepPool}
            validMoves={isHumanTurn(gameState) ? validMoves : []}
            disabled={!isHumanTurn(gameState) || gameState.gameOver || isAIThinking || showTimeUp}
            onSelectStep={handlePlayerMove}
            currentPosition={gameState.currentPosition}
            targetNumber={currentConfig.target}
            onPreviewPosition={setPreviewPosition}
          />

          {/* History Log */}
          <HistoryLog history={gameState.history} />
        </div>

        {/* === SIDEBAR: Essential Controls Only (Progressive Disclosure) === */}
        <div className="sr-sidebar">
          {/* Timer - Always visible */}
          <Timer
            timeLeft={timeLeft}
            formattedTime={formattedTime}
            timerClass={timerClass}
            isPracticeMode={isPracticeMode}
            isPaused={isPaused}
            onModeChange={handlePracticeModeChange}
            onPause={pauseTimer}
            onResume={resumeTimer}
            disabled={gameState.gameOver}
          />

          {/* Game Info Panel - Always visible */}
          <div className="game-info">
            <div className="game-info__item">
              <span className="game-info__label">{t('target')}</span>
              <span className="game-info__value game-info__value--accent">
                {gameState.target}
              </span>
            </div>
            <div className="game-info__item">
              <span className="game-info__label">{t('position')}</span>
              <span className="game-info__value">{gameState.currentPosition}</span>
            </div>
            <div className="game-info__item">
              <span className="game-info__label">{t('turn')}</span>
              <span className={`game-info__value game-info__value--${gameState.turn}`}>
                {turnLabel}
              </span>
            </div>
          </div>

          {/* Undo Button - Always visible when available */}
          {canUndo && (
            <button
              className="action action--secondary"
              onClick={undoLastMove}
              aria-label={t('undo', 'Undo')}
            >
              ↩️ {t('undo', 'Undo')}
            </button>
          )}

          {/* Hint Toggle - Always visible */}
          <button className="action action--secondary" onClick={toggleHints}>
            💡 {showHints ? tc('buttons.hideHints') : tc('buttons.needHelp')}
          </button>

          {/* Hints Panel */}
          {showHints && (
            <div className="sr-hints">
              {teacherHint && (
                <div className="sr-hint">
                  <h4>
                    {teacherHint.wasOptimal
                      ? `✅ ${t('hints.goodMove')}`
                      : `📚 ${t('hints.learningMoment')}`}
                  </h4>
                  <p>{teacherHint.explanation}</p>
                  {!teacherHint.wasOptimal && teacherHint.optimalMove && (
                    <p>{t('hints.optimalPlay', { move: teacherHint.optimalMove })}</p>
                  )}
                </div>
              )}

              <div className="sr-hint">
                <h4>
                  {t('hints.sequence', {
                    name: getSequenceName(currentConfig.sequenceType || 'arithmetic'),
                  })}
                </h4>
                <p>{getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}</p>
              </div>

              {analysis && gameState.turn === 'player' && (
                <div className="sr-hint">
                  <h4>{t('hints.positionAnalysis')}</h4>
                  <p>
                    {analysis.canWin
                      ? `✨ ${t('hints.winningStrategy')}`
                      : `⚠️ ${t('hints.aiAdvantage')}`}
                  </p>
                </div>
              )}

              <div className="sr-hint">
                <h4>{t('hints.gameTheoryTip.title')}</h4>
                <p>{t('hints.gameTheoryTip.message')}</p>
              </div>
            </div>
          )}

          {/* Restart - Always visible */}
          <div className="sr-actions">
            <button className="action action--secondary" onClick={restartGame}>
              🔄 {tc('buttons.restart')}
            </button>
          </div>
        </div>
        {/* === END SIDEBAR === */}

        {/* Settings Drawer - Progressive Disclosure (hidden in daily mode) */}
        {!isDailyMode && (
          <SettingsDrawer
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          >
            {/* Game Mode Section */}
            <SettingsSection title={t('settings.gameMode', 'Game Mode')}>
              <div className="mode-toggle">
                <button
                  className={`mode-toggle__btn ${gameMode === 'vs-ai' ? 'mode-toggle__btn--active' : ''}`}
                  onClick={() => handleModeChange('vs-ai')}
                >
                  🤖 {t('mode.vsAI')}
                </button>
                <button
                  className={`mode-toggle__btn ${gameMode === 'two-player' ? 'mode-toggle__btn--active' : ''}`}
                  onClick={() => handleModeChange('two-player')}
                >
                  👥 {t('mode.twoPlayer')}
                </button>
              </div>
            </SettingsSection>

            {/* Difficulty Section (only for vs-ai) */}
            {gameMode === 'vs-ai' && (
              <SettingsSection title={tc('difficulty.title', 'Difficulty')}>
                <DifficultySelector
                  options={['easy', 'medium', 'hard']}
                  value={difficulty}
                  onChange={handleDifficultyChange}
                />
              </SettingsSection>
            )}

            {/* Game Actions Section */}
            <SettingsSection title={t('settings.actions', 'Actions')}>
              <button className="action action--secondary" onClick={startRandomGame}>
                🎲 {tc('buttons.newGame')}
              </button>
            </SettingsSection>

            {/* Game Rules Section */}
            <SettingsSection title={t('settings.rules', 'Rules')}>
              <div className="game-rules">
                <span className="game-rules__icon">📜</span>
                <p className="game-rules__text">{t('rules')}</p>
              </div>
            </SettingsSection>
          </SettingsDrawer>
        )}

        {/* Game Over Overlay */}
        <VictoryModal
          isOpen={gameState.gameOver}
          variant={isPlayerWin ? 'win' : 'lose'}
          emoji={gameMode === 'two-player' ? '🎊' : gameState.winner === 'player' ? '🎊' : '🤖'}
          title={
            gameMode === 'two-player'
              ? getWinnerLabel()
              : gameState.winner === 'player'
                ? t('gameOver.youWin')
                : t('gameOver.aiWins')
          }
          message={
            gameMode === 'two-player'
              ? t('gameOver.goodGame')
              : gameState.winner === 'player'
                ? t('gameOver.greatStrategy')
                : t('gameOver.betterLuck')
          }
          stats={[
            { value: `${elapsedTime}s`, label: tc('stats.time') },
            { value: gameState.history.length, label: tc('stats.moves') },
          ]}
          insight={
            gameMode === 'vs-ai' && gameState.winner === 'ai'
              ? {
                  title: t('hints.mathTip.title'),
                  message: `${getSequenceName(currentConfig.sequenceType || 'arithmetic')}: ${getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}. ${t('hints.mathTip.nimExplanation')}`,
                }
              : undefined
          }
          personalBest={
            gameState.winner === 'player' && rewards?.personalBest
              ? {
                  currentTime: rewards.personalBest.currentTime,
                  previousBest: rewards.personalBest.previousBest,
                  isNewBest: rewards.personalBest.isNewBest,
                }
              : undefined
          }
          actions={
            isDailyMode ? (
              <a href="/math-games/" className="action action--primary">
                {tc('backToGames')}
              </a>
            ) : (
              <>
                <button className="action action--primary" onClick={restartGame}>
                  {tc('buttons.playAgain')}
                </button>
                <button className="action action--secondary" onClick={startRandomGame}>
                  {tc('buttons.newGame')}
                </button>
              </>
            )
          }
        />

        {/* Time Up Overlay */}
        <VictoryModal
          isOpen={showTimeUp}
          variant="timeUp"
          emoji="⏰"
          title={tc('timer.timeUp')}
          message={tc('timer.practiceMessage')}
          insight={{
            title: t('hints.sequenceTip'),
            message: `${getSequenceName(currentConfig.sequenceType || 'arithmetic')}: ${getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}. ${t('hints.formula')} ${sequenceInfo.formula}`,
          }}
          actions={
            <>
              <button className="action action--primary" onClick={restartGame}>
                {tc('buttons.tryAgain')}
              </button>
              <button className="action action--secondary" onClick={startRandomGame}>
                {tc('buttons.newGame')}
              </button>
            </>
          }
        />
      </div>

      {/* Rank Up Overlay */}
      {showingRankUp && rewards?.rankedUp && rewards.previousRank && rewards.newRank && (
        <RankUpOverlay
          previousRank={rewards.previousRank}
          newRank={rewards.newRank}
          onClose={() => setShowingRankUp(false)}
        />
      )}

      {/* Achievement Toasts */}
      {toastQueue.map((achievement, index) => (
        <AchievementToast
          key={achievement.id}
          achievement={achievement}
          onClose={() => dismissToast(achievement.id)}
          delay={index * 500}
        />
      ))}

      {/* Tutorial */}
      {showTutorial && (
        <SequenceRaceTutorial onComplete={() => setShowTutorial(false)} />
      )}
    </GameLayout>
  );
}

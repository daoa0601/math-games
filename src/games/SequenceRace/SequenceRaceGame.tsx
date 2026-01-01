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
import { useSearchParams } from 'react-router-dom';
import {
  GameLayout,
  DifficultySelector,
  RankUpOverlay,
  AchievementToast,
  Timer,
  SoundToggle,
  GameOverlay,
  PersonalBestIndicator,
} from '@/shared/components';
import { useGameTimer, useGameRewards, useSwipeNavigation, useAnnounce } from '@/shared/hooks';
import { usePlayer } from '@/shared/contexts';
import { playSound, showConfetti } from '@/shared/utils';
import { isDailyCompleted, completeDailyChallenge } from '@/shared/services/daily';
import { RaceTrack, StepCards, HistoryLog, SequenceInfoBadge } from './components';
import { useSequenceRaceState, useAIOpponent, useHintSystem } from './hooks';
import { applyMove, isHumanTurn } from './logic/engine';
import { getDailySequenceRaceConfig } from './logic/seededGenerator';
import './SequenceRace.css';

export function SequenceRaceGame() {
  const { t } = useTranslation('sequenceRace');
  const { t: tc } = useTranslation('common');
  const [searchParams] = useSearchParams();

  // ─────────────────────────────────────────────────────────────────
  // Daily Mode Detection
  // ─────────────────────────────────────────────────────────────────

  const isDailyMode = searchParams.get('daily') === 'true';
  const [dailyCompleted, setDailyCompleted] = useState(() => isDailyMode && isDailyCompleted('sequence-race'));
  const dailyConfigRef = useRef(isDailyMode ? getDailySequenceRaceConfig() : null);

  // ─────────────────────────────────────────────────────────────────
  // Player and Rewards
  // ─────────────────────────────────────────────────────────────────

  const { profile, updatePreferences } = usePlayer();
  const {
    handleCompletion,
    rewards,
    showingRankUp,
    setShowingRankUp,
    toastQueue,
    dismissToast,
  } = useGameRewards();

  // ─────────────────────────────────────────────────────────────────
  // Screen Reader Announcements
  // ─────────────────────────────────────────────────────────────────

  const { announce } = useAnnounce();

  const handleTimeWarning = useCallback((secondsRemaining: number) => {
    if (secondsRemaining === 30) {
      announce(t('timer.warning30', '30 seconds remaining'), 'polite');
    } else if (secondsRemaining === 10) {
      announce(t('timer.warning10', '10 seconds remaining! Hurry!'), 'assertive');
    }
  }, [announce, t]);

  // ─────────────────────────────────────────────────────────────────
  // Timer
  // ─────────────────────────────────────────────────────────────────

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
    isGameOver: false, // Will be set by game state
    practiceMode: profile.preferences.practiceMode,
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
    filteredGames,
    validMoves,
    analysis,
    sequenceInfo,
    setGameState,
    startGame,
    startRandomGame,
    restartGame,
    handleDifficultyChange,
    handleModeChange: handleModeChangeBase,
  } = useSequenceRaceState({ onResetTimer: resetTimer });

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
    onAIMove: setGameState,
  });

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
  // Daily Mode Initialization
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isDailyMode && dailyConfigRef.current) {
      startGame(dailyConfigRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // ─────────────────────────────────────────────────────────────────
  // Practice Mode
  // ─────────────────────────────────────────────────────────────────

  const handlePracticeModeChange = useCallback(
    (newPracticeMode: boolean) => {
      updatePreferences({ practiceMode: newPracticeMode });
    },
    [updatePreferences]
  );

  // ─────────────────────────────────────────────────────────────────
  // Level Navigation (with swipe support)
  // ─────────────────────────────────────────────────────────────────

  const currentGameIndex = useMemo(
    () => filteredGames.findIndex((g) => g.id === currentConfig.id),
    [filteredGames, currentConfig.id]
  );

  const nextGame = useCallback(() => {
    if (filteredGames.length === 0) return;
    const nextIndex = (currentGameIndex + 1) % filteredGames.length;
    startGame({ ...filteredGames[nextIndex], difficulty });
  }, [currentGameIndex, filteredGames, startGame, difficulty]);

  const previousGame = useCallback(() => {
    if (filteredGames.length === 0) return;
    const prevIndex = (currentGameIndex - 1 + filteredGames.length) % filteredGames.length;
    startGame({ ...filteredGames[prevIndex], difficulty });
  }, [currentGameIndex, filteredGames, startGame, difficulty]);

  // Swipe navigation for level selector (mobile)
  const { ref: levelSwipeRef, handlers: levelSwipeHandlers } = useSwipeNavigation({
    onNext: nextGame,
    onPrevious: previousGame,
    enabled: !isDailyMode && !gameState.gameOver && !showTimeUp,
  });

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
  // Win Celebration Effect
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState.gameOver && gameState.winner === 'player') {
      handleCompletion({
        gameId: 'sequence-race',
        levelId: isDailyMode ? 'daily' : currentConfig.id,
        difficulty,
        timeSeconds: elapsedTime,
        practiceMode: isPracticeMode,
        wasWinner: true,
        isOptimalSolution: analysis?.canWin ?? false,
      });

      // Track daily challenge completion
      if (isDailyMode && !dailyCompleted) {
        completeDailyChallenge('sequence-race', elapsedTime);
        setDailyCompleted(true);
      }

      playSound('win');
      showConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
    <GameLayout title={t('title')} headerRight={<SoundToggle />}>
      <div className="sequence-container">
        {/* Daily Challenge Badge */}
        {isDailyMode && (
          <div className="daily-badge">
            <span className="daily-badge__icon">📅</span>
            <span className="daily-badge__text">{tc('daily.dailyChallenge')}</span>
            {dailyCompleted && <span className="daily-badge__check">✓</span>}
          </div>
        )}

        {/* Timer */}
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

        {/* Mode Toggle (hidden in daily mode) */}
        {!isDailyMode && (
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
        )}

        {/* Difficulty Selector (hidden in daily mode) */}
        {!isDailyMode && gameMode === 'vs-ai' && (
          <DifficultySelector
            options={['easy', 'medium', 'hard']}
            value={difficulty}
            onChange={handleDifficultyChange}
          />
        )}

        {/* Game Rules */}
        <div className="game-rules">
          <span className="game-rules__icon">📜</span>
          <p className="game-rules__text">{t('rules')}</p>
        </div>

        {/* Level Selector (hidden in daily mode) - Swipeable on mobile */}
        {!isDailyMode && (
          <div
            className="level-selector"
            ref={levelSwipeRef as React.RefObject<HTMLDivElement>}
            {...levelSwipeHandlers}
          >
            {filteredGames.map((game) => (
              <button
                key={game.id}
                className={`level-btn ${currentConfig.id === game.id ? 'level-btn--active' : ''}`}
                onClick={() => startGame({ ...game, difficulty })}
              >
                {game.name}
              </button>
            ))}
            <button className="btn btn--secondary" onClick={startRandomGame}>
              🎲 {tc('buttons.random')}
            </button>
          </div>
        )}

        {/* Sequence Info */}
        <SequenceInfoBadge sequenceType={currentConfig.sequenceType || 'arithmetic'} />

        {/* Game Info Panel */}
        <div className="game-info-panel">
          <div className="game-info-panel__item">
            <span className="game-info-panel__label">{t('target')}</span>
            <span className="game-info-panel__value game-info-panel__value--glow">
              {gameState.target}
            </span>
          </div>
          <div className="game-info-panel__item">
            <span className="game-info-panel__label">{t('position')}</span>
            <span className="game-info-panel__value">{gameState.currentPosition}</span>
          </div>
          <div className="game-info-panel__item">
            <span className="game-info-panel__label">{t('turn')}</span>
            <span className={`game-info-panel__value game-info-panel__value--${gameState.turn}`}>
              {turnLabel}
            </span>
          </div>
        </div>

        {/* Race Track */}
        <div
          className={`track-wrapper ${!isPracticeMode && timeLeft <= 10 ? 'track-wrapper--urgent' : ''}`}
        >
          <RaceTrack
            state={gameState}
            gameMode={gameMode}
            isAIThinking={isAIThinking}
            aiReaction={aiReaction}
          />
        </div>

        {/* Turn Indicator */}
        {!gameState.gameOver && !showTimeUp && (
          <div className={`turn-indicator turn-indicator--${gameState.turn}`}>
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
        />

        {/* Hint Toggle */}
        <button className="btn btn--secondary hint-toggle" onClick={toggleHints}>
          💡 {showHints ? tc('buttons.hideHints') : tc('buttons.needHelp')}
        </button>

        {/* Hints Panel */}
        {showHints && (
          <div className="hints-panel">
            {teacherHint && (
              <div
                className={`hint-card hint-card--teacher ${teacherHint.wasOptimal ? 'hint-card--teacher-good' : 'hint-card--teacher-learn'}`}
              >
                <h4>
                  {teacherHint.wasOptimal
                    ? `✅ ${t('hints.goodMove')}`
                    : `📚 ${t('hints.learningMoment')}`}
                </h4>
                <p>{teacherHint.explanation}</p>
                {!teacherHint.wasOptimal && teacherHint.optimalMove && (
                  <p className="hint-card__suggestion">
                    {t('hints.optimalPlay', { move: teacherHint.optimalMove })}
                  </p>
                )}
              </div>
            )}

            <div className="hint-card hint-card--concept">
              <h4>
                {t('hints.sequence', {
                  name: getSequenceName(currentConfig.sequenceType || 'arithmetic'),
                })}
              </h4>
              <p>{getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}</p>
            </div>

            {analysis && gameState.turn === 'player' && (
              <div className={`hint-card ${analysis.canWin ? 'hint-card--concept' : 'hint-card--strategy'}`}>
                <h4>{t('hints.positionAnalysis')}</h4>
                <p>
                  {analysis.canWin
                    ? `✨ ${t('hints.winningStrategy')}`
                    : `⚠️ ${t('hints.aiAdvantage')}`}
                </p>
              </div>
            )}

            <div className="hint-card hint-card--strategy">
              <h4>{t('hints.gameTheoryTip.title')}</h4>
              <p>{t('hints.gameTheoryTip.message')}</p>
            </div>
          </div>
        )}

        {/* History Log */}
        <HistoryLog history={gameState.history} />

        {/* Actions */}
        <div className="game-actions">
          <button className="btn btn--secondary" onClick={restartGame}>
            🔄 {tc('buttons.restart')}
          </button>
        </div>

        {/* Game Over Overlay */}
        {gameState.gameOver && (
          <GameOverlay
            variant={isPlayerWin ? 'win' : 'lose'}
            emoji={gameMode === 'two-player' ? '🎊' : gameState.winner === 'player' ? '🎊' : '🤖'}
            title={
              gameMode === 'two-player'
                ? `🎉 ${getWinnerLabel()}`
                : gameState.winner === 'player'
                  ? `🎉 ${t('gameOver.youWin')}`
                  : `🤖 ${t('gameOver.aiWins')}`
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
            hint={
              gameMode === 'vs-ai' && gameState.winner === 'ai' ? (
                <>
                  <h4>💡 {t('hints.mathTip.title')}</h4>
                  <p>
                    <strong>{getSequenceName(currentConfig.sequenceType || 'arithmetic')}:</strong>{' '}
                    {getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}
                  </p>
                  <p>{t('hints.mathTip.nimExplanation')}</p>
                </>
              ) : undefined
            }
          >
            {/* Personal Best Indicator (only on win) */}
            {gameState.winner === 'player' && rewards?.personalBest && (
              <PersonalBestIndicator
                currentTime={rewards.personalBest.currentTime}
                previousBest={rewards.personalBest.previousBest}
                isNewBest={rewards.personalBest.isNewBest}
              />
            )}
            {/* In daily mode, show Back to Games; otherwise show game buttons */}
            {isDailyMode ? (
              <a href="/math-games/" className="btn btn--primary">
                {tc('backToGames')}
              </a>
            ) : (
              <>
                <button className="btn btn--primary" onClick={restartGame}>
                  {tc('buttons.playAgain')}
                </button>
                <button className="btn btn--secondary" onClick={startRandomGame}>
                  {tc('buttons.newGame')}
                </button>
              </>
            )}
          </GameOverlay>
        )}

        {/* Time Up Overlay */}
        {showTimeUp && (
          <GameOverlay
            variant="timeUp"
            emoji="⏰"
            title={tc('timer.timeUp')}
            message={tc('timer.practiceMessage')}
            hint={
              <>
                <h4>💡 {t('hints.sequenceTip')}</h4>
                <p>
                  <strong>{getSequenceName(currentConfig.sequenceType || 'arithmetic')}:</strong>{' '}
                  {getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}
                </p>
                <p>
                  {t('hints.formula')} <code>{sequenceInfo.formula}</code>
                </p>
              </>
            }
          >
            <button className="btn btn--primary" onClick={restartGame}>
              {tc('buttons.tryAgain')}
            </button>
            <button className="btn btn--secondary" onClick={startRandomGame}>
              {tc('buttons.newGame')}
            </button>
          </GameOverlay>
        )}
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
    </GameLayout>
  );
}

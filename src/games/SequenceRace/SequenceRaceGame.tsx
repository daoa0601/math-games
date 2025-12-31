import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { GameLayout, DifficultySelector } from '../../shared/components';
import { useGameTimer, formatTime } from '../../shared/hooks';
import { playSound } from '../../shared/utils';
import { RaceTrack, StepCards, HistoryLog, SequenceInfoBadge } from './components';
import type { SequenceState, GameConfig, GameMode } from './logic/types';
import { createGameState, applyMove, getValidMoves, getAIMove, analyzePosition, analyzePlayerMove, isHumanTurn, type MoveAnalysis } from './logic/engine';
import { presetGames, generateRandomConfig, SEQUENCE_INFO } from './logic/presets';
import './SequenceRace.css';

export function SequenceRaceGame() {
    const { t } = useTranslation('sequenceRace');
    const { t: tc } = useTranslation('common');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [gameMode, setGameMode] = useState<GameMode>('vs-ai');
    const [currentConfig, setCurrentConfig] = useState<GameConfig>(presetGames[0]);
    const [gameState, setGameState] = useState<SequenceState>(() =>
        createGameState({ ...presetGames[0], mode: 'vs-ai' })
    );
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [showHints, setShowHints] = useState(false);

    // Timer hook
    const { timeLeft, showTimeUp, timerClass: timerModifier, elapsedTime, resetTimer } = useGameTimer({
        isGameOver: gameState.gameOver,
    });

    // Teacher mode hints
    const [teacherHint, setTeacherHint] = useState<MoveAnalysis | null>(null);

    // Filter games by difficulty
    const filteredGames = useMemo(() =>
        presetGames.filter(g => g.difficulty === difficulty),
        [difficulty]
    );

    // Get valid moves for current player (memoized)
    const validMoves = useMemo(() => getValidMoves(gameState), [gameState]);

    // Analyze current position
    const analysis = useMemo(() => {
        if (gameState.gameOver) return null;
        return analyzePosition(gameState);
    }, [gameState]);

    // Get sequence info
    const sequenceInfo = useMemo(() => {
        const seqType = currentConfig.sequenceType || 'arithmetic';
        return SEQUENCE_INFO[seqType];
    }, [currentConfig.sequenceType]);

    // Celebrate player win
    useEffect(() => {
        if (gameState.gameOver && gameState.winner === 'player') {
            playSound('win');
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [gameState.gameOver, gameState.winner]);

    // Handle player move (works for both vs-ai and two-player modes)
    const handlePlayerMove = useCallback((step: number) => {
        // In vs-ai mode, only 'player' can move; in two-player, both players can
        if (!isHumanTurn(gameState) || gameState.gameOver || showTimeUp) return;

        // Analyze the move before applying (for teacher hints) - only in vs-ai mode
        if (showHints && gameMode === 'vs-ai') {
            const analysis = analyzePlayerMove(gameState, step);
            setTeacherHint(analysis);
        }

        playSound('click');
        const newState = applyMove(gameState, step);
        setGameState(newState);
    }, [gameState, showTimeUp, showHints, gameMode]);

    // AI turn effect (only in vs-ai mode)
    useEffect(() => {
        if (gameMode === 'vs-ai' && gameState.turn === 'ai' && !gameState.gameOver && !showTimeUp) {
            setIsAIThinking(true);

            const timer = setTimeout(() => {
                try {
                    const aiMove = getAIMove(gameState, currentConfig.difficulty);
                    const newState = applyMove(gameState, aiMove);
                    setGameState(newState);
                } catch (error) {
                    console.error('AI error:', error);
                }
                setIsAIThinking(false);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [gameState, currentConfig.difficulty, showTimeUp, gameMode]);

    // Start new game with config
    const startGame = useCallback((config: GameConfig) => {
        const configWithMode = { ...config, mode: gameMode };
        setCurrentConfig(configWithMode);
        setGameState(createGameState(configWithMode));
        setShowHints(false);
        setTeacherHint(null);
        resetTimer();
    }, [resetTimer, gameMode]);

    // Start random game
    const startRandomGame = useCallback(() => {
        const config = generateRandomConfig(difficulty);
        startGame(config);
    }, [difficulty, startGame]);

    // Restart current game
    const restartGame = useCallback(() => {
        setGameState(createGameState(currentConfig));
        resetTimer();
    }, [currentConfig, resetTimer]);

    // Change difficulty
    const handleDifficultyChange = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
        setDifficulty(newDifficulty);
        const newGames = presetGames.filter(g => g.difficulty === newDifficulty);
        if (newGames.length > 0) {
            startGame(newGames[0]);
        }
    }, [startGame]);

    // Change game mode
    const handleModeChange = useCallback((newMode: GameMode) => {
        setGameMode(newMode);
        // Restart with new mode
        const configWithMode = { ...currentConfig, mode: newMode };
        setCurrentConfig(configWithMode);
        setGameState(createGameState(configWithMode));
        setShowHints(false);
        setTeacherHint(null);
        resetTimer();
    }, [currentConfig, resetTimer]);

    // Timer class
    const timerClass = `timer ${timerModifier}`.trim();

    // Get translated sequence info
    const getSequenceName = (type: string) => t(`sequences.${type}.name`);
    const getSequenceDescription = (type: string) => t(`sequences.${type}.description`);

    // Get turn display info
    const getTurnLabel = () => {
        if (gameMode === 'two-player') {
            return gameState.turn === 'player1'
                ? `🧑 ${t('player1')}`
                : `🧑 ${t('player2')}`;
        }
        return gameState.turn === 'player'
            ? `🧑 ${t('you')}`
            : `🤖 ${t('ai')}`;
    };

    // Get winner display
    const getWinnerLabel = () => {
        if (!gameState.winner) return '';
        if (gameMode === 'two-player') {
            return gameState.winner === 'player1'
                ? t('gameOver.player1Wins')
                : t('gameOver.player2Wins');
        }
        return gameState.winner === 'player'
            ? t('gameOver.youWin')
            : t('gameOver.aiWins');
    };

    const isPlayerWin = gameMode === 'two-player'
        ? gameState.winner === 'player1' || gameState.winner === 'player2'
        : gameState.winner === 'player';

    return (
        <GameLayout title={t('title')}>
            <div className="sequence-container">
                {/* Timer */}
                <div className={timerClass}>
                    <span className="timer__icon">⏱️</span>
                    <span className="timer__value">{formatTime(timeLeft)}</span>
                    {timeLeft <= 10 && <span className="timer__pulse">!</span>}
                </div>

                {/* Mode Toggle */}
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

                {/* Difficulty Selector - only for vs-ai mode */}
                {gameMode === 'vs-ai' && (
                    <DifficultySelector
                        options={['easy', 'medium', 'hard']}
                        value={difficulty}
                        onChange={handleDifficultyChange}
                    />
                )}

                {/* Preset Games */}
                <div className="level-selector">
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

                {/* Sequence Info Badge */}
                <SequenceInfoBadge sequenceType={currentConfig.sequenceType || 'arithmetic'} />

                {/* Game Info */}
                <div className="game-info-panel">
                    <div className="game-info-panel__item">
                        <span className="game-info-panel__label">{t('target')}</span>
                        <span className="game-info-panel__value game-info-panel__value--glow">{gameState.target}</span>
                    </div>
                    <div className="game-info-panel__item">
                        <span className="game-info-panel__label">{t('position')}</span>
                        <span className="game-info-panel__value">{gameState.currentPosition}</span>
                    </div>
                    <div className="game-info-panel__item">
                        <span className="game-info-panel__label">{t('turn')}</span>
                        <span className={`game-info-panel__value game-info-panel__value--${gameState.turn}`}>
                            {getTurnLabel()}
                        </span>
                    </div>
                </div>

                {/* Race Track */}
                <div className={`track-wrapper ${timeLeft <= 10 ? 'track-wrapper--urgent' : ''}`}>
                    <RaceTrack state={gameState} />
                </div>

                {/* Turn Indicator */}
                {!gameState.gameOver && !showTimeUp && (
                    <div className={`turn-indicator turn-indicator--${gameState.turn}`}>
                        {gameMode === 'two-player'
                            ? (gameState.turn === 'player1' ? t('player1Turn') : t('player2Turn'))
                            : gameState.turn === 'player'
                                ? t('yourTurn')
                                : isAIThinking
                                    ? t('aiThinking')
                                    : t('aiTurn')
                        }
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
                <button
                    className="btn btn--secondary hint-toggle"
                    onClick={() => setShowHints(!showHints)}
                >
                    💡 {showHints ? tc('buttons.hideHints') : tc('buttons.needHelp')}
                </button>

                {/* Hints Panel */}
                {showHints && (
                    <div className="hints-panel">
                        {/* Teacher Hint - shows after player moves */}
                        {teacherHint && (
                            <div className={`hint-card hint-card--teacher ${teacherHint.wasOptimal ? 'hint-card--teacher-good' : 'hint-card--teacher-learn'}`}>
                                <h4>{teacherHint.wasOptimal ? `✅ ${t('hints.goodMove')}` : `📚 ${t('hints.learningMoment')}`}</h4>
                                <p>{teacherHint.explanation}</p>
                                {!teacherHint.wasOptimal && teacherHint.optimalMove && (
                                    <p className="hint-card__suggestion">
                                        {t('hints.optimalPlay', { move: teacherHint.optimalMove })}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="hint-card hint-card--concept">
                            <h4>{t('hints.sequence', { name: getSequenceName(currentConfig.sequenceType || 'arithmetic') })}</h4>
                            <p>{getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}</p>
                        </div>
                        {analysis && gameState.turn === 'player' && (
                            <div className={`hint-card ${analysis.canWin ? 'hint-card--concept' : 'hint-card--strategy'}`}>
                                <h4>{t('hints.positionAnalysis')}</h4>
                                <p>
                                    {analysis.canWin
                                        ? `✨ ${t('hints.winningStrategy')}`
                                        : `⚠️ ${t('hints.aiAdvantage')}`
                                    }
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
                    <div className="game-over-overlay">
                        <div className="game-over-overlay__emoji">
                            {gameMode === 'two-player' ? '🎊' : (gameState.winner === 'player' ? '🎊' : '🤖')}
                        </div>
                        <h2 className={`game-over-overlay__title game-over-overlay__title--${isPlayerWin ? 'win' : 'lose'}`}>
                            {gameMode === 'two-player'
                                ? `🎉 ${getWinnerLabel()}`
                                : (gameState.winner === 'player' ? `🎉 ${t('gameOver.youWin')}` : `🤖 ${t('gameOver.aiWins')}`)}
                        </h2>
                        <p className="game-over-overlay__message">
                            {gameMode === 'two-player'
                                ? t('gameOver.goodGame')
                                : (gameState.winner === 'player'
                                    ? t('gameOver.greatStrategy')
                                    : t('gameOver.betterLuck'))
                            }
                        </p>

                        {/* Math Insight on loss - only in vs-ai mode */}
                        {gameMode === 'vs-ai' && gameState.winner === 'ai' && (
                            <div className="failure-hint">
                                <h4>💡 {t('hints.mathTip.title')}</h4>
                                <p>
                                    <strong>{getSequenceName(currentConfig.sequenceType || 'arithmetic')}:</strong> {getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}
                                </p>
                                <p>
                                    {t('hints.mathTip.nimExplanation')}
                                </p>
                            </div>
                        )}

                        <div className="win-overlay__stats">
                            <div className="stat">
                                <span className="stat__value">{elapsedTime}s</span>
                                <span className="stat__label">{tc('stats.time')}</span>
                            </div>
                            <div className="stat">
                                <span className="stat__value">{gameState.history.length}</span>
                                <span className="stat__label">{tc('stats.moves')}</span>
                            </div>
                        </div>

                        <div className="game-actions">
                            <button className="btn btn--primary" onClick={restartGame}>
                                {tc('buttons.playAgain')}
                            </button>
                            <button className="btn btn--secondary" onClick={startRandomGame}>
                                {tc('buttons.newGame')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Time Up Overlay */}
                {showTimeUp && (
                    <div className="time-up-overlay">
                        <h2 className="time-up-overlay__title">⏰ {tc('timer.timeUp')}</h2>
                        <p className="time-up-overlay__message">
                            {tc('timer.practiceMessage')}
                        </p>

                        {/* Math hint on failure */}
                        <div className="failure-hint">
                            <h4>💡 {t('hints.sequenceTip')}</h4>
                            <p>
                                <strong>{getSequenceName(currentConfig.sequenceType || 'arithmetic')}:</strong> {getSequenceDescription(currentConfig.sequenceType || 'arithmetic')}
                            </p>
                            <p>{t('hints.formula')} <code>{sequenceInfo.formula}</code></p>
                        </div>

                        <div className="game-actions">
                            <button className="btn btn--primary" onClick={restartGame}>
                                {tc('buttons.tryAgain')}
                            </button>
                            <button className="btn btn--secondary" onClick={startRandomGame}>
                                {tc('buttons.newGame')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </GameLayout>
    );
}

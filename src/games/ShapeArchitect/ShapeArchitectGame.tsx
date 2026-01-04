import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { GameLayout, DifficultySelector, RankUpOverlay, AchievementToast, Timer, SoundToggle, PersonalBestIndicator, HelpButton } from '../../shared/components';
import { useGameTimer, useGameRewards, useSwipe, useSwipeNavigation, useAnnounce } from '../../shared/hooks';
import { usePlayer } from '../../shared/contexts';
import { playSound, showConfetti } from '../../shared/utils';
import { isDailyCompleted, completeDailyChallenge } from '../../shared/services/daily';
import { shouldShowTutorial } from '@/shared/services/tutorialProgress';
import { GridBoard, GridBoard3D, PieceInventory, LevelEditor, CameraPresetButtons, RotationControls, LayerControls, ShapeArchitectTutorial, PreviewLockButton } from './components';
import type { CameraPreset } from './components/CameraPresetButtons';
import type { Position3D, LevelConfig } from './logic/types';
import { DEFAULT_ROTATION } from './logic/types';
import { createGameState, removePieceFromGrid } from './logic/engine';
import { useShapeArchitectState, usePiecePlacement, useKeyboardControls } from './hooks';
import {
    isLevelCompleted,
    getBestTime,
    getTotalScore,
} from '../../shared/utils';
import './ShapeArchitect.css';

// Geometry hint keys for failure state
const GEOMETRY_HINT_KEYS = [
    'spatialReasoning',
    'fillCornersFirst',
    'areaConservation',
    'rotationMatters',
] as const;

export function ShapeArchitectGame() {
    const { t } = useTranslation('shapeArchitect');
    const { t: tc } = useTranslation('common');
    const [searchParams] = useSearchParams();

    // Daily mode detection
    const isDailyMode = searchParams.get('daily') === 'true';
    const [dailyCompleted, setDailyCompleted] = useState(() => isDailyMode && isDailyCompleted('shape-architect'));

    // Use the extracted state hook
    const {
        gameState,
        setGameState,
        currentLevelIndex,
        difficulty,
        filteredLevels,
        selectedPiece,
        viewMode,
        setViewMode,
        previewLocked,
        effectivePreviewPosition,
        togglePreviewLock,
        setHoverPosition,
        handleSelectPiece,
        handleRotateAxis,
        loadLevel,
        resetLevel: resetLevelState,
        nextLevel: nextLevelState,
        previousLevel: previousLevelState,
        startRandomLevel: startRandomLevelState,
        setDifficulty,
    } = useShapeArchitectState({ isDailyMode });

    const [showHints, setShowHints] = useState(false);
    const [placementError, setPlacementError] = useState<string | null>(null);
    const [progressVersion, setProgressVersion] = useState(0); // Trigger re-render on progress change
    const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
    const [maxVisibleLayer, setMaxVisibleLayer] = useState<number>(() => gameState.level.gridSize[2] - 1);
    const [showEditor, setShowEditor] = useState(false);
    const [showRotationHint, setShowRotationHint] = useState(() => {
        // Show hint if user hasn't rotated before
        return !localStorage.getItem('shape-architect-rotated');
    });

    // Tutorial state
    const [showTutorial, setShowTutorial] = useState(() =>
        shouldShowTutorial('shape-architect')
    );

    // Get total score (re-computed when progressVersion changes)
    // progressVersion is intentionally used as a trigger to force re-computation after level completion
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const totalScore = useMemo(() => getTotalScore('shape-architect'), [progressVersion]);

    // Player and rewards
    const { profile: playerProfile, updatePreferences } = usePlayer();
    const {
        handleCompletion,
        rewards,
        showingRankUp,
        setShowingRankUp,
        toastQueue,
        dismissToast,
    } = useGameRewards();

    // Practice mode from player preferences
    const [practiceMode, setPracticeMode] = useState(playerProfile.preferences.practiceMode);

    // Screen reader announcements for accessibility
    const { announce } = useAnnounce();

    const handleTimeWarning = useCallback((secondsRemaining: number) => {
        if (secondsRemaining === 30) {
            announce(t('timer.warning30', '30 seconds remaining'), 'polite');
        } else if (secondsRemaining === 10) {
            announce(t('timer.warning10', '10 seconds remaining! Hurry!'), 'assertive');
        }
    }, [announce, t]);

    // Timer hook with practice mode support
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
        isGameOver: gameState.isSolved,
        practiceMode,
        onTimeWarning: handleTimeWarning,
    });

    // Announce puzzle solved for screen readers
    useEffect(() => {
        if (gameState.isSolved && !practiceMode) {
            announce(
                tc('announcements.puzzleSolved', { time: elapsedTime }),
                'assertive'
            );
        }
    }, [gameState.isSolved, practiceMode, elapsedTime, announce, tc]);

    // Announce time-up for screen readers
    useEffect(() => {
        if (showTimeUp) {
            announce(tc('announcements.timeUp'), 'assertive');
        }
    }, [showTimeUp, announce, tc]);

    // Auto-select first piece when level loads (fixes rotation disabled issue)
    useEffect(() => {
        if (gameState.remainingPieces.length > 0 && !gameState.selectedPieceId) {
            setGameState(prev => ({
                ...prev,
                selectedPieceId: prev.remainingPieces[0].id
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.level.id]); // Only trigger on level change

    // Handle practice mode toggle
    const handlePracticeModeChange = useCallback((newPracticeMode: boolean) => {
        setPracticeMode(newPracticeMode);
        updatePreferences({ practiceMode: newPracticeMode });
    }, [updatePreferences]);

    // Use placement hook for unified click/drag handling
    const {
        handlePlacement: handlePlacementCore,
        handleDragEnd: handleDragEndCore,
        justPlacedPositions,
    } = usePiecePlacement({
        gameState,
        onPlace: (newState) => {
            playSound('place');
            setGameState(newState);
        },
        onError: (errorKey) => {
            playSound('error');
            setPlacementError(t(`errors.${errorKey}`));
            setTimeout(() => setPlacementError(null), 2000);
        },
        disabled: showTimeUp || gameState.isSolved,
    });

    // Save progress and show confetti when solved
    useEffect(() => {
        if (gameState.isSolved) {
            // Celebrate with confetti!
            playSound('win');
            showConfetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });

            // Find next level in the filtered list
            const currentIdx = filteredLevels.findIndex((l) => l.id === gameState.level.id);
            const nextLevel = filteredLevels[currentIdx + 1];

            // Award stats for completion
            handleCompletion({
                gameId: 'shape-architect',
                levelId: isDailyMode ? 'daily' : gameState.level.id,
                difficulty,
                timeSeconds: elapsedTime,
                practiceMode,
                nextLevelId: isDailyMode ? undefined : nextLevel?.id,
            });

            // Track daily challenge completion
            if (isDailyMode && !dailyCompleted) {
                completeDailyChallenge('shape-architect', elapsedTime);
                setDailyCompleted(true);
            }

            // Trigger re-render of progress-dependent UI
            setProgressVersion((v) => v + 1);
        }
    }, [gameState.isSolved, gameState.level.id, filteredLevels, elapsedTime, difficulty, practiceMode, handleCompletion, isDailyMode, dailyCompleted]);

    // Wrap handleRotateAxis to dismiss hint and play sound
    const handleRotateWithHint = useCallback((axis: 'x' | 'y' | 'z') => {
        handleRotateAxis(axis);
        playSound('click');
        if (showRotationHint) {
            setShowRotationHint(false);
            localStorage.setItem('shape-architect-rotated', 'true');
        }
    }, [handleRotateAxis, showRotationHint]);

    // Wrap cell click to clear error state first
    const handleCellClick = useCallback((position: Position3D) => {
        setPlacementError(null);
        handlePlacementCore(position);
    }, [handlePlacementCore]);

    // Wrap drag end
    const handleDragEnd = useCallback((event: import('@dnd-kit/core').DragEndEvent) => {
        setPlacementError(null);
        handleDragEndCore(event);
    }, [handleDragEndCore]);

    // Wrap level loading to include timer reset and UI state
    const loadLevelWithReset = useCallback((index: number) => {
        loadLevel(index);
        setShowHints(false);
        setMaxVisibleLayer(gameState.level.gridSize[2] - 1);
        resetTimer();
    }, [loadLevel, gameState.level.gridSize, resetTimer]);

    // Change difficulty
    const handleDifficultyChange = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
        setDifficulty(newDifficulty);
        setShowHints(false);
        resetTimer();
    }, [setDifficulty, resetTimer]);

    // Start random level with timer reset
    const startRandomLevel = useCallback(() => {
        startRandomLevelState();
        setMaxVisibleLayer(gameState.level.gridSize[2] - 1);
        resetTimer();
    }, [startRandomLevelState, gameState.level.gridSize, resetTimer]);

    // Handle custom level from LevelEditor
    const handleCustomLevel = useCallback((level: LevelConfig) => {
        setGameState(createGameState(level));
        setShowEditor(false);
        setMaxVisibleLayer(level.gridSize[2] - 1);
        resetTimer();
        playSound('click');
    }, [setGameState, resetTimer]);

    // Reset level with timer
    const resetLevel = useCallback(() => {
        resetLevelState();
        resetTimer();
    }, [resetLevelState, resetTimer]);

    // Next level with timer reset
    const nextLevel = useCallback(() => {
        nextLevelState();
        setShowHints(false);
        resetTimer();
    }, [nextLevelState, resetTimer]);

    // Previous level with timer reset
    const previousLevel = useCallback(() => {
        previousLevelState();
        setShowHints(false);
        resetTimer();
    }, [previousLevelState, resetTimer]);

    // Swipe navigation for level selector (mobile)
    const { ref: levelSwipeRef, handlers: levelSwipeHandlers } = useSwipeNavigation({
        onNext: nextLevel,
        onPrevious: previousLevel,
        enabled: !isDailyMode && !gameState.isSolved && !showTimeUp,
    });

    // Undo last piece placement
    const undoLastPiece = useCallback(() => {
        if (gameState.placedPieces.length === 0) return;

        const lastPlaced = gameState.placedPieces[gameState.placedPieces.length - 1];
        const originalPiece = gameState.level.pieces.find(p => p.id === lastPlaced.pieceId);
        if (!originalPiece) return;

        // Remove piece from grid, passing targetVoxels for proper cell restoration
        const newGrid = removePieceFromGrid(
            gameState.grid,
            originalPiece,
            lastPlaced,
            gameState.level.targetVoxels
        );

        // Remove from placed pieces list
        const newPlacedPieces = gameState.placedPieces.slice(0, -1);

        // Add back to remaining pieces
        const newRemaining = [...gameState.remainingPieces, originalPiece];

        setGameState({
            ...gameState,
            grid: newGrid,
            placedPieces: newPlacedPieces,
            remainingPieces: newRemaining,
            selectedPieceId: null,
            isSolved: false,
        });
    }, [gameState, setGameState]);

    // Keyboard shortcuts via hook
    useKeyboardControls({
        onRotateX: () => handleRotateWithHint('x'),
        onRotateY: () => handleRotateWithHint('y'),
        onRotateZ: () => handleRotateWithHint('z'),
        onUndo: undoLastPiece,
        onEscape: () => setGameState(prev => ({ ...prev, selectedPieceId: null, rotation: { ...DEFAULT_ROTATION } })),
        onTogglePreviewLock: togglePreviewLock,
        enabled: !gameState.isSolved && !showTimeUp,
        levelType: gameState.level.type,
        hasSelectedPiece: !!selectedPiece,
    });

    // Swipe gestures for piece rotation (mobile)
    const { ref: swipeRef, handlers: swipeHandlers } = useSwipe({
        onSwipeLeft: () => {
            if (selectedPiece && !showTimeUp && !gameState.isSolved) {
                handleRotateWithHint('z');
            }
        },
        onSwipeRight: () => {
            // Counter-clockwise rotation (rotate 3 times = -90°)
            if (selectedPiece && !showTimeUp && !gameState.isSolved) {
                handleRotateWithHint('z');
                handleRotateAxis('z'); // Additional rotations without hint/sound
                handleRotateAxis('z');
            }
        },
        threshold: 50,
        enabled: !!selectedPiece && !showTimeUp && !gameState.isSolved,
    });

    // Random hint for failure
    const failureHintKey = GEOMETRY_HINT_KEYS[Math.floor(Math.random() * GEOMETRY_HINT_KEYS.length)];

    return (
        <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
            <GameLayout
                title={t('title')}
                gameId="shape-architect"
                headerRight={
                    <>
                        <HelpButton gameId="shape-architect" onShowTutorial={() => setShowTutorial(true)} />
                        <SoundToggle />
                    </>
                }
            >
                <div className="shape-container">
                    {/* Daily Challenge Badge */}
                    {isDailyMode && (
                        <div className="daily-badge">
                            <span className="daily-badge__icon">📅</span>
                            <span className="daily-badge__text">{tc('daily.dailyChallenge')}</span>
                            {dailyCompleted && <span className="daily-badge__check">✓</span>}
                        </div>
                    )}

                    {/* Timer with Practice/Timed Mode Toggle */}
                    <Timer
                        timeLeft={timeLeft}
                        formattedTime={formattedTime}
                        timerClass={timerClass}
                        isPracticeMode={isPracticeMode}
                        isPaused={isPaused}
                        onModeChange={handlePracticeModeChange}
                        onPause={pauseTimer}
                        onResume={resumeTimer}
                        disabled={gameState.isSolved}
                    />

                    {/* Difficulty Selector (hidden in daily mode) */}
                    {!isDailyMode && (
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

                    {/* Score Display */}
                    {totalScore > 0 && (
                        <div className="score-display">
                            <span className="score-display__label">{tc('stats.score')}:</span>
                            <span className="score-display__value">{totalScore}</span>
                        </div>
                    )}

                    {/* Level Selector (hidden in daily mode) - Swipeable on mobile */}
                    {!isDailyMode && (
                        <div
                            className="level-selector"
                            ref={levelSwipeRef as React.RefObject<HTMLDivElement>}
                            {...levelSwipeHandlers}
                        >
                            {filteredLevels.map((level, index) => {
                                const unlocked = true; // All levels always accessible
                                const completed = isLevelCompleted('shape-architect', level.id);
                                const bestTime = getBestTime('shape-architect', level.id);

                                return (
                                    <button
                                        key={level.id}
                                        className={`level-btn ${index === currentLevelIndex ? 'level-btn--active' : ''} ${completed ? 'level-btn--completed' : ''} ${!unlocked ? 'level-btn--locked' : ''}`}
                                        onClick={() => unlocked && loadLevelWithReset(index)}
                                        disabled={!unlocked}
                                        title={!unlocked ? tc('completePreviousLevel') : bestTime ? `${tc('best')}: ${bestTime}s` : undefined}
                                    >
                                        {!unlocked && '🔒 '}
                                        {completed && '✓ '}
                                        {level.name}
                                        {bestTime && <span className="level-btn__time">{bestTime}s</span>}
                                    </button>
                                );
                            })}
                            <button className="btn btn--secondary" onClick={startRandomLevel}>
                                🎲 {tc('buttons.random')}
                            </button>
                            <button className="btn btn--secondary" onClick={() => setShowEditor(true)}>
                                ✏️ {t('editor.openEditor')}
                            </button>
                        </div>
                    )}

                    {/* Level Info */}
                    <div className="level-info">
                        <div className="level-info__item">
                            <span className="level-info__label">{t('level')}</span>
                            <span className="level-info__value">{gameState.level.name}</span>
                        </div>
                        <div className="level-info__item">
                            <span className="level-info__label">{t('piecesLeft')}</span>
                            <span className="level-info__value level-info__value--glow">{gameState.remainingPieces.length}</span>
                        </div>
                        <div className="level-info__item">
                            <span className="level-info__label">{t('rotation')}</span>
                            <span className="level-info__value">
                                X:{gameState.rotation.x}° Y:{gameState.rotation.y}° Z:{gameState.rotation.z}°
                            </span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="instructions">
                        {selectedPiece
                            ? t('instructions.placePiece', { piece: selectedPiece.name })
                            : t('instructions.selectPiece')
                        }
                    </div>

                    {/* Placement Error Feedback */}
                    {placementError && (
                        <div className="placement-error" role="alert">
                            ⚠️ {placementError}
                        </div>
                    )}

                    {/* View Mode Toggle */}
                    <div className="view-mode-toggle" role="group" aria-label="View mode">
                        <button
                            className={`view-mode-btn ${viewMode === '2d' ? 'view-mode-btn--active' : ''}`}
                            onClick={() => setViewMode('2d')}
                            aria-pressed={viewMode === '2d'}
                        >
                            2D
                        </button>
                        <button
                            className={`view-mode-btn ${viewMode === '3d' ? 'view-mode-btn--active' : ''}`}
                            onClick={() => setViewMode('3d')}
                            aria-pressed={viewMode === '3d'}
                            disabled={gameState.level.type === '2D'}
                            title={gameState.level.type === '2D' ? t('viewMode.2dOnlyLevel', 'This level is 2D only') : undefined}
                        >
                            3D
                        </button>
                        {gameState.level.type === '3D' && (
                            <span className="view-mode-toggle__badge">3D Level</span>
                        )}
                    </div>

                    {/* Grid Board */}
                    {!showEditor && (
                        <div className={`board-wrapper ${!isPracticeMode && timeLeft <= 10 ? 'board-wrapper--urgent' : ''}`}>
                            {viewMode === '2d' ? (
                                <GridBoard
                                    grid={gameState.grid}
                                    gridSize={gameState.level.gridSize}
                                    selectedPiece={selectedPiece}
                                    rotation={gameState.rotation}
                                    placedPieces={gameState.placedPieces}
                                    levelPieces={gameState.level.pieces}
                                    onCellClick={handleCellClick}
                                    hoverPosition={effectivePreviewPosition}
                                    onCellHover={setHoverPosition}
                                    justPlacedPositions={justPlacedPositions}
                                    isPreviewLocked={previewLocked}
                                />
                            ) : (
                                <>
                                    <div className="view-3d-controls">
                                        <CameraPresetButtons
                                            activePreset={cameraPreset}
                                            onPresetChange={setCameraPreset}
                                        />
                                        <LayerControls
                                            depth={gameState.level.gridSize[2]}
                                            maxVisibleLayer={maxVisibleLayer}
                                            onChange={setMaxVisibleLayer}
                                            disabled={gameState.isSolved || showTimeUp}
                                        />
                                    </div>
                                    <GridBoard3D
                                        grid={gameState.grid}
                                        gridSize={gameState.level.gridSize}
                                        selectedPiece={selectedPiece}
                                        rotation={gameState.rotation}
                                        placedPieces={gameState.placedPieces}
                                        levelPieces={gameState.level.pieces}
                                        onCellClick={handleCellClick}
                                        hoverPosition={effectivePreviewPosition}
                                        onCellHover={setHoverPosition}
                                        cameraPreset={cameraPreset}
                                        maxVisibleLayer={maxVisibleLayer}
                                        isPreviewLocked={previewLocked}
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* Controls - Swipe area for mobile rotation */}
                    <div
                        className="shape-controls"
                        ref={swipeRef as React.RefObject<HTMLDivElement>}
                        {...swipeHandlers}
                    >
                        <button
                            className="btn btn--icon"
                            onClick={undoLastPiece}
                            disabled={gameState.placedPieces.length === 0 || showTimeUp || gameState.isSolved}
                            title={`${t('controls.undoTitle')} (Ctrl+Z)`}
                        >
                            ↩️
                        </button>
                        <RotationControls
                            rotation={gameState.rotation}
                            onRotateX={() => handleRotateAxis('x')}
                            onRotateY={() => handleRotateAxis('y')}
                            onRotateZ={() => handleRotateAxis('z')}
                            disabled={!selectedPiece || showTimeUp || gameState.isSolved}
                            mode={gameState.level.type}
                        />
                        <PreviewLockButton
                            locked={previewLocked}
                            onToggle={togglePreviewLock}
                            disabled={!selectedPiece || showTimeUp || gameState.isSolved}
                        />
                        {showRotationHint && selectedPiece && (
                            <div className="rotation-hint-tooltip">
                                <span>💡 {t('hints.rotationTip')}</span>
                            </div>
                        )}
                        {/* Mobile swipe hint */}
                        {selectedPiece && (
                            <div className="swipe-hint" aria-hidden="true">
                                <span>👆 {t('hints.swipeRotate', '← Swipe to rotate →')}</span>
                            </div>
                        )}
                    </div>

                    {/* Piece Inventory */}
                    <PieceInventory
                        pieces={gameState.remainingPieces}
                        selectedPieceId={gameState.selectedPieceId}
                        onSelectPiece={handleSelectPiece}
                        rotation={gameState.rotation}
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
                            <div className="hint-card hint-card--concept">
                                <h4>🧱 {t('hints.tetrominoTip.title')}</h4>
                                <p>{t('hints.tetrominoTip.message')}</p>
                            </div>
                            <div className="hint-card hint-card--strategy">
                                <h4>🎯 {t('hints.strategy.title')}</h4>
                                <p>{t('hints.strategy.message')}</p>
                            </div>
                            <div className="hint-card hint-card--spatial">
                                <h4>🧠 {t('hints.spatialThinking.title')}</h4>
                                <p>{t('hints.spatialThinking.message')}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="game-actions">
                        <button className="btn btn--secondary" onClick={resetLevel}>
                            🔄 {tc('buttons.reset')}
                        </button>
                        <button className="btn btn--primary" onClick={nextLevel}>
                            {tc('buttons.nextLevel')} →
                        </button>
                    </div>

                    {/* Win Overlay */}
                    {gameState.isSolved && (
                        <div className="shape-win-overlay">
                            <div className="win-overlay__emoji">🧱</div>
                            <h2 className="shape-win-overlay__title">{t('win.title')}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
                                {t('win.message')}
                            </p>

                            <div className="win-overlay__stats">
                                <div className="stat">
                                    <span className="stat__value">{elapsedTime}s</span>
                                    <span className="stat__label">{tc('stats.time')}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat__value">{gameState.level.pieces.length}</span>
                                    <span className="stat__label">{tc('stats.pieces')}</span>
                                </div>
                            </div>

                            {/* Personal Best Indicator */}
                            {rewards?.personalBest && (
                                <PersonalBestIndicator
                                    currentTime={rewards.personalBest.currentTime}
                                    previousBest={rewards.personalBest.previousBest}
                                    isNewBest={rewards.personalBest.isNewBest}
                                    className="win-overlay__pb"
                                />
                            )}

                            <div className="math-insight">
                                <h4>💡 {t('win.geometryInsight.title')}</h4>
                                <p>
                                    {t('win.geometryInsight.message')}
                                </p>
                            </div>
                            <div className="game-actions">
                                {/* In daily mode, show Back to Games; otherwise show game buttons */}
                                {isDailyMode ? (
                                    <a href="/math-games/" className="btn btn--primary">
                                        {tc('backToGames')}
                                    </a>
                                ) : (
                                    <>
                                        <button className="btn btn--primary" onClick={nextLevel}>
                                            {tc('buttons.nextLevel')} →
                                        </button>
                                        <button className="btn btn--secondary" onClick={startRandomLevel}>
                                            {tc('buttons.randomLevel')}
                                        </button>
                                    </>
                                )}
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

                            <div className="failure-hint">
                                <h4>💡 {t(`hints.failure.${failureHintKey}.title`)}</h4>
                                <p>{t(`hints.failure.${failureHintKey}.tip`)}</p>
                            </div>

                            <div className="game-actions">
                                <button className="btn btn--primary" onClick={resetLevel}>
                                    {tc('buttons.tryAgain')}
                                </button>
                                <button className="btn btn--secondary" onClick={nextLevel}>
                                    {tc('buttons.skipLevel')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gamification Overlays */}
                {showingRankUp && rewards?.rankedUp && rewards.previousRank && rewards.newRank && (
                    <RankUpOverlay
                        previousRank={rewards.previousRank}
                        newRank={rewards.newRank}
                        onClose={() => setShowingRankUp(false)}
                    />
                )}
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
                    <ShapeArchitectTutorial
                        onComplete={() => setShowTutorial(false)}
                        is3DMode={viewMode === '3d'}
                    />
                )}

                {/* Level Editor Modal */}
                {showEditor && (
                    <div className="level-editor-overlay">
                        <LevelEditor
                            onLevelCreated={handleCustomLevel}
                            onCancel={() => setShowEditor(false)}
                        />
                    </div>
                )}
            </GameLayout>
        </DndContext>
    );
}

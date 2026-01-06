import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { GameLayout, DifficultySelector, RankUpOverlay, AchievementToast, Timer, SoundToggle, PersonalBestIndicator, HelpButton } from '@/shared/components';
import { useGameTimer, useGameRewards, useSwipe, useAnnounce } from '@/shared/hooks';
import { usePlayer } from '@/shared/contexts';
import { playSound, showConfetti } from '@/shared/utils';
import { isDailyCompleted, completeDailyChallenge } from '@/shared/services/daily';
import { shouldShowTutorial } from '@/shared/services/tutorialProgress';
import { GridBoard, GridBoard3D, PieceInventory, LevelEditor, CameraPresetButtons, RotationControls, LayerControls, ShapeArchitectTutorial, PreviewLockButton, PlacedPieceControls, PlacementModal } from './components';
import type { CameraPreset } from './components/CameraPresetButtons';
import type { Position3D, LevelConfig } from './logic/types';
import { DEFAULT_ROTATION } from './logic/types';
import { createGameState, removePieceFromGrid } from './logic/engine';
import { useShapeArchitectState, usePiecePlacement, usePlacedPieceMovement, useKeyboardControls } from './hooks';
import { getTotalScore } from '@/shared/utils';
import '@/shared/styles/game-base.css';
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
        resetLevel: resetLevelState,
        nextLevel: nextLevelState,
        startRandomLevel: startRandomLevelState,
        setDifficulty,
        // Placement modal state and actions
        placementModal,
        openPlacementModal,
        closePlacementModal,
        rotateModalPiece,
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

    // Use movement hook for moving already-placed pieces
    const {
        selectedPlacedPieceId,
        selectPlacedPiece,
        clearSelection: clearMoveSelection,
        handleMoveToPosition,
        handleDragEnd: handleMoveDragEnd,
        setPreviewPosition: setMovePreviewPosition,
        isPreviewValid: isMovePreviewValid,
        justMovedPositions,
        moveRotation,
        rotateMoveAxis,
    } = usePlacedPieceMovement({
        gameState,
        onMove: (newState) => {
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

    // Wrap cell click to handle both placement and movement
    const handleCellClick = useCallback((position: Position3D) => {
        setPlacementError(null);

        // If a placed piece is selected for movement, try to move it
        if (selectedPlacedPieceId) {
            handleMoveToPosition(position);
            return;
        }

        // If a piece from inventory is selected, open placement modal
        if (selectedPiece) {
            openPlacementModal(position);
            return;
        }
    }, [selectedPlacedPieceId, handleMoveToPosition, selectedPiece, openPlacementModal]);

    // Handle confirmation from placement modal
    const handleModalConfirm = useCallback(() => {
        if (!placementModal.targetPosition) return;

        // Place the piece using the modal's rotation
        handlePlacementCore(placementModal.targetPosition, placementModal.rotation);
        closePlacementModal();
    }, [placementModal.targetPosition, placementModal.rotation, handlePlacementCore, closePlacementModal]);

    // Wrap drag end to handle both placement and movement drags
    const handleDragEnd = useCallback((event: import('@dnd-kit/core').DragEndEvent) => {
        setPlacementError(null);

        // If a placed piece is selected for movement, handle move drag
        if (selectedPlacedPieceId) {
            handleMoveDragEnd(event);
            return;
        }

        // Otherwise, handle normal placement drag
        handleDragEndCore(event);
    }, [handleDragEndCore, selectedPlacedPieceId, handleMoveDragEnd]);

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

    // Handle escape key - clears both piece selection and movement selection
    const handleEscape = useCallback(() => {
        if (selectedPlacedPieceId) {
            clearMoveSelection();
        } else {
            setGameState(prev => ({ ...prev, selectedPieceId: null, rotation: { ...DEFAULT_ROTATION } }));
        }
    }, [selectedPlacedPieceId, clearMoveSelection, setGameState]);

    // Keyboard shortcuts via hook
    useKeyboardControls({
        onRotateX: () => selectedPlacedPieceId ? rotateMoveAxis('x') : handleRotateWithHint('x'),
        onRotateY: () => selectedPlacedPieceId ? rotateMoveAxis('y') : handleRotateWithHint('y'),
        onRotateZ: () => selectedPlacedPieceId ? rotateMoveAxis('z') : handleRotateWithHint('z'),
        onUndo: undoLastPiece,
        onEscape: handleEscape,
        onTogglePreviewLock: togglePreviewLock,
        enabled: !gameState.isSolved && !showTimeUp,
        levelType: gameState.level.type,
        hasSelectedPiece: !!selectedPiece || !!selectedPlacedPieceId,
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

    // Random hint for failure - memoized to prevent re-randomization on every render
    const failureHintKey = useMemo(
        () => GEOMETRY_HINT_KEYS[Math.floor(Math.random() * GEOMETRY_HINT_KEYS.length)],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [showTimeUp] // Only recalculate when time-up state changes
    );

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
                <div className="sa-container sa-layout">
                    {/* === MAIN AREA: Board and inventory === */}
                    <div className="sa-main">
                        {/* Daily Challenge Badge */}
                        {isDailyMode && (
                            <div className="daily-badge">
                                <span className="daily-badge__icon">📅</span>
                                <span className="daily-badge__text">{tc('daily.dailyChallenge')}</span>
                                {dailyCompleted && <span className="daily-badge__check">✓</span>}
                            </div>
                        )}

                        {/* Instructions */}
                        <div className={`sa-instructions ${selectedPlacedPieceId ? 'sa-instructions--move-mode' : ''}`}>
                            {selectedPlacedPieceId ? (
                                <>
                                    <span className="sa-instructions__move-icon">✋</span>
                                    {t('instructions.movePiece', 'Click a target cell to move the selected piece. Press Esc to cancel.')}
                                    <button
                                        className="action action--sm action--ghost sa-instructions__cancel"
                                        onClick={clearMoveSelection}
                                        aria-label={t('instructions.cancelMove', 'Cancel move')}
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : selectedPiece ? (
                                t('instructions.placePiece', { piece: selectedPiece.name })
                            ) : (
                                t('instructions.selectPiece')
                            )}
                        </div>

                        {/* Placement Error Feedback */}
                        {placementError && (
                            <div className="sa-error" role="alert">
                                ⚠️ {placementError}
                            </div>
                        )}

                        {/* View Mode Toggle */}
                        <div className="sa-view-mode" role="group" aria-label="View mode">
                            <button
                                className={`sa-view-mode__btn ${viewMode === '2d' ? 'sa-view-mode__btn--active' : ''}`}
                                onClick={() => setViewMode('2d')}
                                aria-pressed={viewMode === '2d'}
                            >
                                2D
                            </button>
                            <button
                                className={`sa-view-mode__btn ${viewMode === '3d' ? 'sa-view-mode__btn--active' : ''}`}
                                onClick={() => setViewMode('3d')}
                                aria-pressed={viewMode === '3d'}
                                disabled={gameState.level.type === '2D'}
                                title={gameState.level.type === '2D' ? t('viewMode.2dOnlyLevel', 'This level is 2D only') : undefined}
                            >
                                3D
                            </button>
                            {gameState.level.type === '3D' && (
                                <span className="sa-view-mode__badge">3D Level</span>
                            )}
                        </div>

                        {/* Grid Board */}
                        {!showEditor && (
                            <div className={`sa-board-wrapper ${!isPracticeMode && timeLeft <= 10 ? 'sa-board-wrapper--urgent' : ''}`}>
                                {viewMode === '2d' ? (
                                    <GridBoard
                                        grid={gameState.grid}
                                        gridSize={gameState.level.gridSize}
                                        selectedPiece={selectedPlacedPieceId ? null : selectedPiece}
                                        rotation={selectedPlacedPieceId ? moveRotation : gameState.rotation}
                                        placedPieces={gameState.placedPieces}
                                        levelPieces={gameState.level.pieces}
                                        onCellClick={handleCellClick}
                                        hoverPosition={effectivePreviewPosition}
                                        onCellHover={selectedPlacedPieceId ? setMovePreviewPosition : setHoverPosition}
                                        justPlacedPositions={justMovedPositions.size > 0 ? justMovedPositions : justPlacedPositions}
                                        isPreviewLocked={previewLocked}
                                        selectedPlacedPieceId={selectedPlacedPieceId}
                                        onPlacedPieceClick={selectPlacedPiece}
                                        isMovePreviewValid={isMovePreviewValid}
                                        moveRotation={moveRotation}
                                    />
                                ) : (
                                    <>
                                        <div className="sa-3d-controls">
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
                                            selectedPiece={selectedPlacedPieceId ? null : selectedPiece}
                                            rotation={selectedPlacedPieceId ? moveRotation : gameState.rotation}
                                            placedPieces={gameState.placedPieces}
                                            levelPieces={gameState.level.pieces}
                                            onCellClick={handleCellClick}
                                            hoverPosition={effectivePreviewPosition}
                                            onCellHover={selectedPlacedPieceId ? setMovePreviewPosition : setHoverPosition}
                                            cameraPreset={cameraPreset}
                                            maxVisibleLayer={maxVisibleLayer}
                                            isPreviewLocked={previewLocked}
                                            justPlacedPositions={justMovedPositions.size > 0 ? justMovedPositions : justPlacedPositions}
                                            selectedPlacedPieceId={selectedPlacedPieceId}
                                            onPlacedPieceClick={selectPlacedPiece}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Piece Inventory */}
                        <PieceInventory
                            pieces={gameState.remainingPieces}
                            selectedPieceId={gameState.selectedPieceId}
                            onSelectPiece={handleSelectPiece}
                            rotation={gameState.rotation}
                        />
                    </div>

                    {/* === SIDEBAR: Controls and info === */}
                    <div className="sa-sidebar">
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

                        {/* Editor Access Button (hidden in daily mode) */}
                        {!isDailyMode && (
                            <button
                                className="action action--secondary"
                                onClick={() => setShowEditor(true)}
                            >
                                ✏️ {t('editor.openEditor')}
                            </button>
                        )}

                        {/* Level Info */}
                        <div className="game-info">
                            <div className="game-info__item">
                                <span className="game-info__label">{t('level')}</span>
                                <span className="game-info__value">{gameState.level.name}</span>
                            </div>
                            <div className="game-info__item">
                                <span className="game-info__label">{t('piecesLeft')}</span>
                                <span className="game-info__value">{gameState.remainingPieces.length}</span>
                            </div>
                            <div className="game-info__item">
                                <span className="game-info__label">{t('rotation')}</span>
                                <span className="game-info__value">
                                    X:{gameState.rotation.x}° Y:{gameState.rotation.y}° Z:{gameState.rotation.z}°
                                </span>
                            </div>
                        </div>

                        {/* Controls - Swipe area for mobile rotation */}
                        <div
                            className="sa-controls"
                            ref={swipeRef as React.RefObject<HTMLDivElement>}
                            {...swipeHandlers}
                        >
                            <button
                                className="action action--icon"
                                onClick={undoLastPiece}
                                disabled={gameState.placedPieces.length === 0 || showTimeUp || gameState.isSolved}
                                title={`${t('controls.undoTitle')} (Ctrl+Z)`}
                            >
                                ↩️
                            </button>
                            <RotationControls
                                rotation={selectedPlacedPieceId ? moveRotation : gameState.rotation}
                                onRotateX={() => selectedPlacedPieceId ? rotateMoveAxis('x') : handleRotateAxis('x')}
                            onRotateY={() => selectedPlacedPieceId ? rotateMoveAxis('y') : handleRotateAxis('y')}
                            onRotateZ={() => selectedPlacedPieceId ? rotateMoveAxis('z') : handleRotateAxis('z')}
                            disabled={(!selectedPiece && !selectedPlacedPieceId) || showTimeUp || gameState.isSolved}
                            mode={gameState.level.type}
                        />
                        <PreviewLockButton
                            locked={previewLocked}
                            onToggle={togglePreviewLock}
                            disabled={!selectedPiece || showTimeUp || gameState.isSolved}
                        />
                        {showRotationHint && selectedPiece && (
                            <div className="sa-hint sa-hint--rotation">
                                <span>💡 {t('hints.rotationTip')}</span>
                            </div>
                        )}
                        {/* Mobile swipe hint */}
                        {selectedPiece && (
                            <div className="sa-hint sa-hint--swipe" aria-hidden="true">
                                <span>👆 {t('hints.swipeRotate', '← Swipe to rotate →')}</span>
                            </div>
                        )}
                        </div>

                        {/* Hint Toggle */}
                        <button
                            className="action action--secondary"
                            onClick={() => setShowHints(!showHints)}
                        >
                            💡 {showHints ? tc('buttons.hideHints') : tc('buttons.needHelp')}
                        </button>

                        {/* Hints Panel */}
                        {showHints && (
                            <div className="game-hints">
                                <div className="game-hints__card">
                                    <h4>🧱 {t('hints.tetrominoTip.title')}</h4>
                                    <p>{t('hints.tetrominoTip.message')}</p>
                                </div>
                                <div className="game-hints__card">
                                    <h4>🎯 {t('hints.strategy.title')}</h4>
                                    <p>{t('hints.strategy.message')}</p>
                                </div>
                                <div className="game-hints__card">
                                    <h4>🧠 {t('hints.spatialThinking.title')}</h4>
                                    <p>{t('hints.spatialThinking.message')}</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="game-actions">
                            <button className="action action--secondary" onClick={resetLevel}>
                                🔄 {tc('buttons.reset')}
                            </button>
                            <button className="action action--primary" onClick={nextLevel}>
                                {tc('buttons.nextLevel')} →
                            </button>
                        </div>
                    </div>
                    {/* === END SIDEBAR === */}

                    {/* Win Overlay */}
                    {gameState.isSolved && (
                        <div className="game-modal">
                            <div className="game-modal__emoji">🧱</div>
                            <h2 className="game-modal__title game-modal__title--success">{t('win.title')}</h2>
                            <p className="game-modal__message">
                                {t('win.message')}
                            </p>

                            <div className="game-modal__stats">
                                <div className="game-modal__stat">
                                    <span className="game-modal__stat-value">{elapsedTime}s</span>
                                    <span className="game-modal__stat-label">{tc('stats.time')}</span>
                                </div>
                                <div className="game-modal__stat">
                                    <span className="game-modal__stat-value">{gameState.level.pieces.length}</span>
                                    <span className="game-modal__stat-label">{tc('stats.pieces')}</span>
                                </div>
                            </div>

                            {/* Personal Best Indicator */}
                            {rewards?.personalBest && (
                                <PersonalBestIndicator
                                    currentTime={rewards.personalBest.currentTime}
                                    previousBest={rewards.personalBest.previousBest}
                                    isNewBest={rewards.personalBest.isNewBest}
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
                                    <a href="/math-games/" className="action action--primary">
                                        {tc('backToGames')}
                                    </a>
                                ) : (
                                    <>
                                        <button className="action action--primary" onClick={nextLevel}>
                                            {tc('buttons.nextLevel')} →
                                        </button>
                                        <button className="action action--secondary" onClick={startRandomLevel}>
                                            {tc('buttons.randomLevel')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Time Up Overlay */}
                    {showTimeUp && (
                        <div className="game-modal">
                            <h2 className="game-modal__title">⏰ {tc('timer.timeUp')}</h2>
                            <p className="game-modal__message">
                                {tc('timer.practiceMessage')}
                            </p>

                            <div className="math-insight">
                                <h4>💡 {t(`hints.failure.${failureHintKey}.title`)}</h4>
                                <p>{t(`hints.failure.${failureHintKey}.tip`)}</p>
                            </div>

                            <div className="game-actions">
                                <button className="action action--primary" onClick={resetLevel}>
                                    {tc('buttons.tryAgain')}
                                </button>
                                <button className="action action--secondary" onClick={nextLevel}>
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

                {/* Mobile Controls for Moving Pieces */}
                <PlacedPieceControls
                    selectedPieceId={selectedPlacedPieceId}
                    rotation={moveRotation}
                    onRotateAxis={rotateMoveAxis}
                    onCancel={clearMoveSelection}
                    is2DMode={gameState.level.type === '2D'}
                    disabled={showTimeUp || gameState.isSolved}
                />

                {/* Placement Modal for rotation preview before placing */}
                <PlacementModal
                    isOpen={placementModal.isOpen}
                    piece={selectedPiece}
                    position={placementModal.targetPosition}
                    rotation={placementModal.rotation}
                    grid={gameState.grid}
                    gridSize={gameState.level.gridSize}
                    viewMode={viewMode}
                    onRotate={rotateModalPiece}
                    onConfirm={handleModalConfirm}
                    onCancel={closePlacementModal}
                />

                {/* Level Editor Modal */}
                {showEditor && (
                    <div className="sa-editor-overlay">
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

import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { GameLayout, GameShell, GameHeader, GameFooter, DifficultySelector, RankUpOverlay, AchievementToast, Timer, SoundToggle, HelpButton, VictoryModal, SettingsDrawer, SettingsDrawerTrigger, SettingsSection } from '@/shared/components';
import { useGameTimer, useGameRewards, useSwipe, useAnnounce, useGameInit, useGameTranslations } from '@/shared/hooks';
import { playSound, showConfetti, triggerHaptic } from '@/shared/utils';
import { completeDailyChallenge } from '@/shared/services/daily';
import { GridBoard, PieceInventory, LevelEditor, RotationControls, ShapeArchitectTutorial, PreviewLockButton, PlacedPieceControls, PlacementToolbar } from './components';
import type { Position3D, LevelConfig, Difficulty } from './logic/types';
import { DEFAULT_ROTATION } from './logic/types';
import { createGameState, removePieceFromGrid, canPlacePiece } from './logic/engine';
import { useShapeArchitectState, usePiecePlacement, usePlacedPieceMovement, useKeyboardControls, useThrottledHover } from './hooks';
import '@/shared/styles/game-base.css';
import './ShapeArchitect.css';

// Geometry hint keys for failure state
const GEOMETRY_HINT_KEYS = [
    'spatialReasoning',
    'fillCornersFirst',
    'areaConservation',
    'rotationMatters',
] as const;

export const ShapeArchitectGame = memo(function ShapeArchitectGame() {
    const { t, tc } = useGameTranslations('shapeArchitect');

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
    } = useGameInit({ gameId: 'shape-architect' });

    // Use the extracted state hook
    const {
        gameState,
        setGameState,
        difficulty,
        filteredLevels,
        selectedPiece,
        previewLocked,
        effectivePreviewPosition,
        togglePreviewLock,
        setHoverPosition,
        handleSelectPiece: handleSelectPieceBase,
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

    // Wrap piece selection with light haptic feedback
    const handleSelectPiece = useCallback((pieceId: string) => {
        triggerHaptic('light');
        handleSelectPieceBase(pieceId);
    }, [handleSelectPieceBase]);

    const [showHints, setShowHints] = useState(false);
    const [placementError, setPlacementError] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showRotationHint, setShowRotationHint] = useState(() => {
        // Show hint if user hasn't rotated before
        return !localStorage.getItem('shape-architect-rotated');
    });

    // Refs for setTimeout cleanup to prevent memory leaks
    const placementErrorTimeoutRef = useRef<number | null>(null);
    const moveErrorTimeoutRef = useRef<number | null>(null);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (placementErrorTimeoutRef.current) {
                clearTimeout(placementErrorTimeoutRef.current);
            }
            if (moveErrorTimeoutRef.current) {
                clearTimeout(moveErrorTimeoutRef.current);
            }
        };
    }, []);


    // Rewards
    const {
        handleCompletion,
        rewards,
        showingRankUp,
        setShowingRankUp,
        toastQueue,
        dismissToast,
    } = useGameRewards();

    // Screen reader announcements for game events
    const { announce } = useAnnounce();

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

    // Use placement hook for unified click/drag handling
    const {
        handlePlacement: handlePlacementCore,
        handleDragEnd: handleDragEndCore,
        justPlacedPositions,
    } = usePiecePlacement({
        gameState,
        onPlace: (newState) => {
            playSound('place');
            triggerHaptic('medium'); // Satisfying tactile feedback
            setGameState(newState);
        },
        onError: (errorKey) => {
            playSound('error');
            triggerHaptic('heavy'); // Strong feedback for errors
            setPlacementError(t(`errors.${errorKey}`));
            if (placementErrorTimeoutRef.current) {
                clearTimeout(placementErrorTimeoutRef.current);
            }
            placementErrorTimeoutRef.current = window.setTimeout(() => setPlacementError(null), 2000);
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
            triggerHaptic('medium');
            setGameState(newState);
        },
        onError: (errorKey) => {
            playSound('error');
            triggerHaptic('heavy');
            setPlacementError(t(`errors.${errorKey}`));
            if (moveErrorTimeoutRef.current) {
                clearTimeout(moveErrorTimeoutRef.current);
            }
            moveErrorTimeoutRef.current = window.setTimeout(() => setPlacementError(null), 2000);
        },
        disabled: showTimeUp || gameState.isSolved,
    });

    // Throttle hover handlers to reduce re-renders during mouse movement
    const throttledSetHoverPosition = useThrottledHover(setHoverPosition);
    const throttledSetMovePreviewPosition = useThrottledHover(setMovePreviewPosition);

    // Save progress and show confetti when solved
    useEffect(() => {
        if (gameState.isSolved) {
            // Celebrate with confetti and strong haptic!
            playSound('win');
            triggerHaptic('heavy'); // Celebratory feedback
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
        }
    }, [gameState.isSolved, gameState.level.id, filteredLevels, elapsedTime, difficulty, practiceMode, handleCompletion, isDailyMode, dailyCompleted, setDailyCompleted]);

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
    // Dual UX: tap-to-place directly if valid, otherwise open modal for rotation
    const handleCellClick = useCallback((position: Position3D) => {
        setPlacementError(null);

        // If a placed piece is selected for movement, try to move it
        if (selectedPlacedPieceId) {
            handleMoveToPosition(position);
            return;
        }

        // If a piece from inventory is selected, check if position is valid
        if (selectedPiece) {
            const isValid = canPlacePiece(
                gameState.grid,
                selectedPiece,
                position,
                gameState.rotation,
                gameState.level.gridSize
            );

            if (isValid) {
                // Direct placement - skip modal for valid positions
                handlePlacementCore(position, gameState.rotation);
            } else {
                // Open modal for rotation adjustment when position is invalid
                openPlacementModal(position);
            }
            return;
        }
    }, [selectedPlacedPieceId, handleMoveToPosition, selectedPiece, gameState.grid, gameState.rotation, gameState.level.gridSize, handlePlacementCore, openPlacementModal]);

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
    const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
        setDifficulty(newDifficulty);
        setShowHints(false);
        resetTimer();
    }, [setDifficulty, resetTimer]);

    // Start random level with timer reset
    const startRandomLevel = useCallback(() => {
        startRandomLevelState();
        resetTimer();
    }, [startRandomLevelState, resetTimer]);

    // Handle custom level from LevelEditor
    const handleCustomLevel = useCallback((level: LevelConfig) => {
        setGameState(createGameState(level));
        setShowEditor(false);
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
                        <SettingsDrawerTrigger onClick={() => setIsSettingsOpen(true)} />
                        <HelpButton gameId="shape-architect" onShowTutorial={() => setShowTutorial(true)} />
                        <SoundToggle />
                    </>
                }
            >
                {/* Daily Challenge Banner - Above GameShell */}
                {isDailyMode && (
                    <div className="sa-daily-banner">
                        <span className="sa-daily-banner__icon">📅</span>
                        <span className="sa-daily-banner__text">{tc('daily.dailyChallenge')}</span>
                        {dailyCompleted && <span className="sa-daily-banner__check">✓</span>}
                    </div>
                )}

                <GameShell gameId="shape-architect" data-testid="shape-architect-shell">
                    {/* Header Strip: Level | Timer | Pieces Left */}
                    <GameHeader
                        progress={{
                            current: gameState.level.pieces.length - gameState.remainingPieces.length,
                            total: gameState.level.pieces.length,
                            label: t('piecesLeft'),
                        }}
                        timer={{
                            formattedTime,
                            mode: isPracticeMode ? 'practice' : 'timed',
                            isPaused,
                            urgencyClass: timerClass,
                        }}
                        target={{
                            value: gameState.level.name,
                            label: t('level'),
                        }}
                    />

                    {/* === MAIN BOARD AREA === */}
                    <div className="game-shell__board">
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

                        {/* Grid Board (2D only - 3D mode removed) */}
                        {!showEditor && (
                            <div className={`sa-board-wrapper ${!isPracticeMode && timeLeft <= 10 ? 'sa-board-wrapper--urgent' : ''}`}>
                                <GridBoard
                                    grid={gameState.grid}
                                    gridSize={gameState.level.gridSize}
                                    selectedPiece={selectedPlacedPieceId ? null : selectedPiece}
                                    rotation={selectedPlacedPieceId ? moveRotation : gameState.rotation}
                                    placedPieces={gameState.placedPieces}
                                    levelPieces={gameState.level.pieces}
                                    onCellClick={handleCellClick}
                                    hoverPosition={effectivePreviewPosition}
                                    onCellHover={selectedPlacedPieceId ? throttledSetMovePreviewPosition : throttledSetHoverPosition}
                                    justPlacedPositions={justMovedPositions.size > 0 ? justMovedPositions : justPlacedPositions}
                                    isPreviewLocked={previewLocked}
                                    selectedPlacedPieceId={selectedPlacedPieceId}
                                    onPlacedPieceClick={selectPlacedPiece}
                                    isMovePreviewValid={isMovePreviewValid}
                                    moveRotation={moveRotation}
                                />
                            </div>
                        )}
                    </div>

                    {/* === CONTROLS AREA === */}
                    <div className="game-shell__controls">
                        {/* Piece Inventory */}
                        <PieceInventory
                            pieces={gameState.remainingPieces}
                            selectedPieceId={gameState.selectedPieceId}
                            onSelectPiece={handleSelectPiece}
                            rotation={gameState.rotation}
                        />

                        {/* Rotation Controls - Swipe area for mobile */}
                        <div
                            className="sa-controls"
                            ref={swipeRef as React.RefObject<HTMLDivElement>}
                            {...swipeHandlers}
                        >
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
                    </div>

                    {/* Footer: Actions */}
                    <GameFooter
                        onUndo={gameState.placedPieces.length > 0 ? undoLastPiece : undefined}
                        canUndo={gameState.placedPieces.length > 0 && !showTimeUp && !gameState.isSolved}
                        onHint={() => setShowHints(!showHints)}
                        onReset={resetLevel}
                        onNext={!isDailyMode ? nextLevel : undefined}
                        canProceed={!isDailyMode}
                        primaryLabel={tc('buttons.nextLevel')}
                    />
                </GameShell>

      {/* Hints Panel - Outside GameShell */}
      {showHints && (
        <div className="sa-hints-panel">
          <div className="sa-hint">
            <h4>💡 {t('hints.geometryTips.title')}</h4>
            <p>{t('hints.geometryTips.message')}</p>
          </div>
          <div className="sa-hint">
            <h4>🧩 {t('hints.rotationHelp.title')}</h4>
            <p>{t('hints.rotationHelp.message')}</p>
          </div>
          <button className="sa-hints-close" onClick={() => setShowHints(false)}>
            {tc('buttons.hideHints')}
          </button>
        </div>
      )}

      {/* Settings Drawer (Progressive Disclosure) */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        {/* Timer Controls */}
        <SettingsSection title={tc('timer.title', 'Timer')}>
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
        </SettingsSection>

        {!isDailyMode && (
          <SettingsSection title={tc('difficulty.title', 'Difficulty')}>
            <DifficultySelector
              options={['easy', 'medium', 'hard', 'expert', 'master'] as const}
              value={difficulty}
              onChange={handleDifficultyChange}
            />
          </SettingsSection>
        )}
        <SettingsSection title={tc('settings.rules', 'Rules')}>
          <div className="game-rules">
            <span className="game-rules__icon">📜</span>
            <p className="game-rules__text">{t('rules')}</p>
          </div>
        </SettingsSection>
        {!isDailyMode && (
          <SettingsSection title={tc('settings.actions', 'Actions')}>
            <button
              className="action action--secondary"
              onClick={() => {
                setShowEditor(true);
                setIsSettingsOpen(false);
              }}
            >
              ✏️ {t('editor.openEditor')}
            </button>
          </SettingsSection>
        )}
      </SettingsDrawer>

                    {/* Win Overlay - using VictoryModal for proper portal/z-index handling */}
                    <VictoryModal
                        isOpen={gameState.isSolved}
                        variant="win"
                        emoji="🧱"
                        title={t('win.title')}
                        message={t('win.message')}
                        stats={[
                            { value: `${elapsedTime}s`, label: tc('stats.time') },
                            { value: gameState.level.pieces.length, label: tc('stats.pieces') },
                        ]}
                        personalBest={rewards?.personalBest ?? undefined}
                        insight={{
                            title: t('win.geometryInsight.title'),
                            message: t('win.geometryInsight.message'),
                        }}
                        actions={
                            isDailyMode ? (
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
                            )
                        }
                    />

                    {/* Time Up Overlay - using VictoryModal for consistency */}
                    <VictoryModal
                        isOpen={showTimeUp}
                        variant="timeUp"
                        emoji="⏰"
                        title={tc('timer.timeUp')}
                        message={tc('timer.practiceMessage')}
                        insight={{
                            title: t(`hints.failure.${failureHintKey}.title`),
                            message: t(`hints.failure.${failureHintKey}.tip`),
                        }}
                        actions={
                            <>
                                <button className="action action--primary" onClick={resetLevel}>
                                    {tc('buttons.tryAgain')}
                                </button>
                                <button className="action action--secondary" onClick={nextLevel}>
                                    {tc('buttons.skipLevel')}
                                </button>
                            </>
                        }
                    />

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

                {/* Placement Toolbar for rotation controls before placing */}
                {placementModal.isOpen && (
                    <div className="sa-placement-toolbar-wrapper">
                        <PlacementToolbar
                            isOpen={placementModal.isOpen}
                            piece={selectedPiece}
                            position={placementModal.targetPosition}
                            rotation={placementModal.rotation}
                            grid={gameState.grid}
                            gridSize={gameState.level.gridSize}
                            onRotate={rotateModalPiece}
                            onConfirm={handleModalConfirm}
                            onCancel={closePlacementModal}
                        />
                    </div>
                )}

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
});

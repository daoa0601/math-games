import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { GameLayout, DifficultySelector, RankUpOverlay, AchievementToast, Timer, SoundToggle, PersonalBestIndicator } from '../../shared/components';
import { useGameTimer, useGameRewards, useSwipe, useSwipeNavigation, useAnnounce } from '../../shared/hooks';
import { usePlayer } from '../../shared/contexts';
import { playSound, showConfetti } from '../../shared/utils';
import { isDailyCompleted, completeDailyChallenge } from '../../shared/services/daily';
import { GridBoard, GridBoard3D, PieceInventory, LevelEditor, CameraPresetButtons, RotationControls, LayerControls } from './components';
import type { CameraPreset } from './components/CameraPresetButtons';
import type { GameState, Position3D, Piece, LevelConfig, Rotation3D, RotationAxis } from './logic/types';
import { DEFAULT_ROTATION } from './logic/types';
import { createGameState, tryPlacePiece, placePiece, checkSolved, removePieceFromGrid, findNearestValidPosition, getPieceWorldPositions, rotateBy90OnAxis } from './logic/engine';
import { presetLevels, generateRandomLevel } from './logic/presets';
import { getDailyShapeArchitectLevel } from './logic/seededGenerator';
import {
    isLevelUnlocked,
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
    const dailyLevelRef = useRef(isDailyMode ? getDailyShapeArchitectLevel() : null);

    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(isDailyMode ? 'medium' : 'easy');
    const [gameState, setGameState] = useState<GameState>(() => {
        // In daily mode, use the seeded daily level
        if (isDailyMode && dailyLevelRef.current) {
            return createGameState(dailyLevelRef.current);
        }
        return createGameState(presetLevels[0]);
    });
    const [showHints, setShowHints] = useState(false);
    const [placementError, setPlacementError] = useState<string | null>(null);
    const [hoverPosition, setHoverPosition] = useState<Position3D | null>(null);
    const [progressVersion, setProgressVersion] = useState(0); // Trigger re-render on progress change
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
    const [maxVisibleLayer, setMaxVisibleLayer] = useState<number>(() => gameState.level.gridSize[2] - 1);
    const [showEditor, setShowEditor] = useState(false);
    const [showRotationHint, setShowRotationHint] = useState(() => {
        // Show hint if user hasn't rotated before
        return !localStorage.getItem('shape-architect-rotated');
    });
    const [justPlacedPositions, setJustPlacedPositions] = useState<Set<string>>(new Set());

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

    // Handle practice mode toggle
    const handlePracticeModeChange = useCallback((newPracticeMode: boolean) => {
        setPracticeMode(newPracticeMode);
        updatePreferences({ practiceMode: newPracticeMode });
    }, [updatePreferences]);

    // Filter levels by difficulty
    const filteredLevels = useMemo(() =>
        presetLevels.filter(l => l.difficulty === difficulty),
        [difficulty]
    );

    // Get selected piece
    const selectedPiece = gameState.remainingPieces.find(
        (p) => p.id === gameState.selectedPieceId
    ) ?? null;

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

    // Handle piece selection
    const handleSelectPiece = useCallback((pieceId: string) => {
        if (showTimeUp) return;
        setGameState((prev) => ({
            ...prev,
            selectedPieceId: prev.selectedPieceId === pieceId ? null : pieceId,
            rotation: { ...DEFAULT_ROTATION },
        }));
    }, [showTimeUp]);

    // Handle rotation on specific axis
    const handleRotateAxis = useCallback((axis: RotationAxis) => {
        setGameState((prev) => ({
            ...prev,
            rotation: rotateBy90OnAxis(prev.rotation, axis),
        }));
        // Dismiss rotation hint after first use
        if (showRotationHint) {
            setShowRotationHint(false);
            localStorage.setItem('shape-architect-rotated', 'true');
        }
    }, [showRotationHint]);

    // Handle cell click (place piece)
    const handleCellClick = useCallback((position: Position3D) => {
        if (showTimeUp) return;
        setPlacementError(null);

        if (!gameState.selectedPieceId) {
            playSound('error');
            setPlacementError(t('errors.selectFirst'));
            setTimeout(() => setPlacementError(null), 2000);
            return;
        }

        const newState = tryPlacePiece(gameState, position);
        if (newState) {
            playSound('place');
            setGameState(newState);

            // Trigger snap animation for placed cells
            const piece = gameState.remainingPieces.find(p => p.id === gameState.selectedPieceId);
            if (piece) {
                const snappedPos = findNearestValidPosition(
                    gameState.grid, piece, position, gameState.rotation, gameState.level.gridSize, 2
                );
                if (snappedPos) {
                    const positions = getPieceWorldPositions(piece, snappedPos, gameState.rotation);
                    const posSet = new Set(positions.map(p => `${p.x},${p.y},${p.z}`));
                    setJustPlacedPositions(posSet);
                    setTimeout(() => setJustPlacedPositions(new Set()), 400);
                }
            }
        } else {
            playSound('error');
            setPlacementError(t('errors.cannotPlace'));
            setTimeout(() => setPlacementError(null), 2000);
        }
    }, [gameState, showTimeUp, t]);

    // Handle drag end for piece placement
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        if (showTimeUp) return;
        setPlacementError(null);

        const { active, over } = event;
        if (!over) return;

        // Extract position from droppable id
        const overId = over.id as string;
        if (!overId.startsWith('cell-')) return;

        const position = over.data.current?.position as Position3D | undefined;
        if (!position) return;

        // Get the dragged piece
        const piece = active.data.current?.piece as Piece | undefined;
        const dragRotation = active.data.current?.rotation as Rotation3D | undefined;
        const rotation: Rotation3D = dragRotation ?? gameState.rotation;
        if (!piece) return;

        // Check if placement is valid, using snap-to-nearest
        const finalPosition = findNearestValidPosition(
            gameState.grid,
            piece,
            position,
            rotation,
            gameState.level.gridSize,
            2
        );

        if (!finalPosition) {
            playSound('error');
            setPlacementError(t('errors.cannotPlace'));
            setTimeout(() => setPlacementError(null), 2000);
            return;
        }

        // Place the piece at snapped position
        playSound('place');
        const newGrid = placePiece(gameState.grid, piece, finalPosition, rotation);
        const newRemaining = gameState.remainingPieces.filter((p) => p.id !== piece.id);
        const isSolved = checkSolved(newGrid, gameState.level.targetVoxels);

        // Trigger snap animation for placed cells
        const positions = getPieceWorldPositions(piece, finalPosition, rotation);
        const posSet = new Set(positions.map(p => `${p.x},${p.y},${p.z}`));
        setJustPlacedPositions(posSet);
        setTimeout(() => setJustPlacedPositions(new Set()), 400);

        setGameState({
            ...gameState,
            grid: newGrid,
            placedPieces: [
                ...gameState.placedPieces,
                { pieceId: piece.id, position: finalPosition, rotation: { ...rotation }, color: piece.color },
            ],
            remainingPieces: newRemaining,
            selectedPieceId: null,
            rotation: { ...DEFAULT_ROTATION },
            isSolved,
        });
    }, [gameState, showTimeUp, t]);

    // Load level
    const loadLevel = useCallback((index: number, levels: typeof presetLevels) => {
        const level = levels[index];
        if (!level) return;
        setCurrentLevelIndex(index);
        setGameState(createGameState(level));
        setShowHints(false);
        setMaxVisibleLayer(level.gridSize[2] - 1); // Reset layer visibility for new level
        resetTimer();
    }, [resetTimer]);

    // Change difficulty
    const handleDifficultyChange = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
        setDifficulty(newDifficulty);
        const newLevels = presetLevels.filter(l => l.difficulty === newDifficulty);
        if (newLevels.length > 0) {
            loadLevel(0, newLevels);
        }
    }, [loadLevel]);

    // Start random level
    const startRandomLevel = useCallback(() => {
        const level = generateRandomLevel(difficulty);
        setGameState(createGameState(level));
        setMaxVisibleLayer(level.gridSize[2] - 1);
        resetTimer();
    }, [difficulty, resetTimer]);

    // Handle custom level from LevelEditor
    const handleCustomLevel = useCallback((level: LevelConfig) => {
        setGameState(createGameState(level));
        setShowEditor(false);
        setMaxVisibleLayer(level.gridSize[2] - 1);
        resetTimer();
        playSound('click');
    }, [resetTimer]);

    // Reset level
    const resetLevel = useCallback(() => {
        setGameState(createGameState(gameState.level));
        resetTimer();
    }, [gameState.level, resetTimer]);

    // Next level
    const nextLevel = useCallback(() => {
        const nextIndex = (currentLevelIndex + 1) % filteredLevels.length;
        loadLevel(nextIndex, filteredLevels);
    }, [currentLevelIndex, filteredLevels, loadLevel]);

    // Previous level
    const previousLevel = useCallback(() => {
        const prevIndex = (currentLevelIndex - 1 + filteredLevels.length) % filteredLevels.length;
        loadLevel(prevIndex, filteredLevels);
    }, [currentLevelIndex, filteredLevels, loadLevel]);

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
    }, [gameState]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle shortcuts if game is over or time is up
            if (gameState.isSolved || showTimeUp) return;

            // Don't handle if focus is in an input element
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key.toLowerCase()) {
                case 'r':
                    // Rotate Z axis (roll) - default rotation key
                    if (selectedPiece) {
                        handleRotateAxis('z');
                        playSound('click');
                    }
                    break;
                case 't':
                    // Rotate X axis (pitch)
                    if (selectedPiece) {
                        handleRotateAxis('x');
                        playSound('click');
                    }
                    break;
                case 'y':
                    // Rotate Y axis (yaw)
                    if (selectedPiece) {
                        handleRotateAxis('y');
                        playSound('click');
                    }
                    break;
                case 'escape':
                    // Deselect piece
                    if (gameState.selectedPieceId) {
                        setGameState(prev => ({ ...prev, selectedPieceId: null, rotation: { ...DEFAULT_ROTATION } }));
                    }
                    break;
                case 'z':
                    // Ctrl+Z = undo
                    if ((e.ctrlKey || e.metaKey) && gameState.placedPieces.length > 0) {
                        e.preventDefault();
                        undoLastPiece();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState.isSolved, showTimeUp, selectedPiece, gameState.selectedPieceId, gameState.placedPieces.length, handleRotateAxis, undoLastPiece]);

    // Swipe gestures for piece rotation (mobile)
    const { ref: swipeRef, handlers: swipeHandlers } = useSwipe({
        onSwipeLeft: () => {
            if (selectedPiece && !showTimeUp && !gameState.isSolved) {
                handleRotateAxis('z');
                playSound('click');
            }
        },
        onSwipeRight: () => {
            // Counter-clockwise rotation (rotate 3 times = -90°)
            if (selectedPiece && !showTimeUp && !gameState.isSolved) {
                handleRotateAxis('z');
                handleRotateAxis('z');
                handleRotateAxis('z');
                playSound('click');
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
                headerRight={<SoundToggle />}
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
                                const firstLevelId = filteredLevels[0]?.id ?? '';
                                const unlocked = isLevelUnlocked('shape-architect', level.id, firstLevelId);
                                const completed = isLevelCompleted('shape-architect', level.id);
                                const bestTime = getBestTime('shape-architect', level.id);

                                return (
                                    <button
                                        key={level.id}
                                        className={`level-btn ${index === currentLevelIndex ? 'level-btn--active' : ''} ${completed ? 'level-btn--completed' : ''} ${!unlocked ? 'level-btn--locked' : ''}`}
                                        onClick={() => unlocked && loadLevel(index, filteredLevels)}
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
                        >
                            3D
                        </button>
                    </div>

                    {/* Grid Board or Editor */}
                    {showEditor ? (
                        <LevelEditor
                            onLevelCreated={handleCustomLevel}
                            onCancel={() => setShowEditor(false)}
                        />
                    ) : (
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
                                    hoverPosition={hoverPosition}
                                    onCellHover={setHoverPosition}
                                    justPlacedPositions={justPlacedPositions}
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
                                        hoverPosition={hoverPosition}
                                        onCellHover={setHoverPosition}
                                        cameraPreset={cameraPreset}
                                        maxVisibleLayer={maxVisibleLayer}
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
            </GameLayout>
        </DndContext>
    );
}

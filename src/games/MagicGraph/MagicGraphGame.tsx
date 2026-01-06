import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { GameLayout, DifficultySelector, RankUpOverlay, AchievementToast, Timer, SoundToggle, HelpButton } from '@/shared/components';
import { useGameTimer, useGameRewards, useAnnounce, useFocusTrap } from '@/shared/hooks';
import { usePlayer } from '@/shared/contexts';
import { playSound, showConfetti } from '@/shared/utils';
import { isDailyCompleted, completeDailyChallenge } from '@/shared/services/daily';
import { shouldShowTutorial } from '@/shared/services/tutorialProgress';
import { PuzzleBoard, NumberInventory, NumberPicker, TopologyEditor, MagicGraphTutorial } from './components';
import type { PuzzleConfig, Difficulty, OptimizationGoal } from './logic/types';
import { generatePuzzle, isPuzzleSolved, getLineStatus, findImpossibleLines, findBestStartingNode, deriveAlgebraicHints, findOptimalSums, checkOptimalSolution, calculateSumSearchRange } from './logic/solver';
import { getHints, getProgressHint, createRandomBasePuzzle } from './logic/puzzles';
import { getDailyMagicGraphPuzzle } from './logic/seededGenerator';
import { useHistory, useWorkerSolver } from './hooks';
import '@/shared/styles/game-base.css';
import './MagicGraph.css';

interface PickerState {
    nodeId: string;
    position: { x: number; y: number };
}

export function MagicGraphGame() {
    const { t } = useTranslation('magicGraph');
    const { t: tc } = useTranslation('common');
    const [searchParams] = useSearchParams();

    // Daily mode detection
    const isDailyMode = searchParams.get('daily') === 'true';
    const [dailyCompleted, setDailyCompleted] = useState(() => isDailyMode && isDailyCompleted('magic-graph'));

    const [difficulty, setDifficulty] = useState<Difficulty>(isDailyMode ? 'medium' : 'easy');

    // Player and rewards
    const { profile, updatePreferences } = usePlayer();
    const {
        handleCompletion,
        rewards,
        showingRankUp,
        setShowingRankUp,
        toastQueue,
        dismissToast,
    } = useGameRewards();

    // Practice mode from player preferences
    const [practiceMode, setPracticeMode] = useState(profile.preferences.practiceMode);

    // Tutorial state
    const [showTutorial, setShowTutorial] = useState(() =>
        shouldShowTutorial('magic-graph')
    );

    // Generate initial puzzle once and derive both states from it
    const [puzzle, setPuzzle] = useState<PuzzleConfig>(() => {
        // In daily mode, load the seeded daily puzzle
        if (isDailyMode) {
            return getDailyMagicGraphPuzzle();
        }
        // Start with a random puzzle based on initial difficulty
        const { basePuzzle, hintsToShow } = createRandomBasePuzzle('easy');
        return generatePuzzle(basePuzzle, hintsToShow);
    });

    // Use worker solver for non-blocking puzzle generation
    const { generatePuzzle: workerGeneratePuzzle, isWorking: isWorkerBusy } = useWorkerSolver();

    // Use history hook for undo/redo support
    const createInitialNodeValues = useCallback((p: PuzzleConfig) => {
        const map = new Map<string, number | null>();
        p.nodes.forEach((n) => map.set(n.id, n.value));
        return map;
    }, []);

    const [nodeValues, nodeValuesHistory] = useHistory<Map<string, number | null>>(
        createInitialNodeValues(puzzle)
    );
    // New interaction: click node first, then pick number from popup
    const [pickerState, setPickerState] = useState<PickerState | null>(null);
    const [showWin, setShowWin] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [justPlacedNodeId, setJustPlacedNodeId] = useState<string | null>(null);

    // Game modal ref for focus trap (used after useGameTimer)
    const gameModalRef = useRef<HTMLDivElement>(null);

    // Puzzle board ref for auto-scroll
    const puzzleBoardRef = useRef<HTMLDivElement>(null);

    // Unsolvable button state
    const [showUnsolvableButton, setShowUnsolvableButton] = useState(false);
    const [unsolvableFeedback, setUnsolvableFeedback] = useState<{
        type: 'correct' | 'wrong';
        message: string;
    } | null>(null);

    // Screen reader announcements for accessibility
    const { announce } = useAnnounce();

    // Time warning callback for screen reader announcements
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
        isGameOver: showWin,
        practiceMode,
        onTimeWarning: handleTimeWarning,
    });

    // Focus trap for game modal (win/time-up states)
    useFocusTrap({
        containerRef: gameModalRef,
        enabled: showWin || showTimeUp,
        autoFocus: true,
    });

    // Announce puzzle solved for screen readers
    useEffect(() => {
        if (showWin && !practiceMode) {
            const timeInSeconds = Math.floor(elapsedTime / 1000);
            announce(
                tc('announcements.puzzleSolved', { time: timeInSeconds }),
                'assertive'
            );
        }
    }, [showWin, practiceMode, elapsedTime, announce, tc]);

    // Announce time-up for screen readers
    useEffect(() => {
        if (showTimeUp) {
            announce(tc('announcements.timeUp'), 'assertive');
        }
    }, [showTimeUp, announce, tc]);

    // Auto-scroll to puzzle board on load (for mobile UX)
    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            puzzleBoardRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Show unsolvable button after 45 seconds (only for seeded daily puzzles)
    useEffect(() => {
        if (showWin || showTimeUp || practiceMode) {
            setShowUnsolvableButton(false);
            return;
        }

        // Only show for puzzles that have isSolvable defined (seeded puzzles)
        if (puzzle.isSolvable === undefined) {
            setShowUnsolvableButton(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowUnsolvableButton(true);
        }, 45000); // 45 seconds

        return () => clearTimeout(timer);
    }, [puzzle.isSolvable, showWin, showTimeUp, practiceMode, puzzle.id]);

    // Handle declare unsolvable
    const handleDeclareUnsolvable = useCallback(() => {
        if (puzzle.isSolvable === undefined) return;

        if (!puzzle.isSolvable) {
            // Correct! The puzzle is unsolvable
            pauseTimer();
            setUnsolvableFeedback({
                type: 'correct',
                message: t('unsolvable.correct', 'Correct! This puzzle has no valid solution.'),
            });

            // Award stats for correctly identifying unsolvable
            handleCompletion({
                gameId: 'magic-graph',
                levelId: isDailyMode ? 'daily' : puzzle.name,
                difficulty,
                timeSeconds: elapsedTime,
                practiceMode,
            });

            // Track daily challenge completion
            if (isDailyMode && !dailyCompleted) {
                completeDailyChallenge('magic-graph', elapsedTime);
                setDailyCompleted(true);
            }

            playSound('win');
            showConfetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
            });
            setTimeout(() => setShowWin(true), 800);
        } else {
            // Wrong! The puzzle is solvable
            setUnsolvableFeedback({
                type: 'wrong',
                message: t('unsolvable.wrong', 'This puzzle has a solution. Keep trying!'),
            });
            playSound('click');

            // Clear feedback after 3 seconds
            setTimeout(() => setUnsolvableFeedback(null), 3000);
        }
    }, [puzzle, pauseTimer, handleCompletion, isDailyMode, difficulty, elapsedTime, practiceMode, dailyCompleted, t]);

    // Handle practice mode toggle
    const handlePracticeModeChange = useCallback((newPracticeMode: boolean) => {
        setPracticeMode(newPracticeMode);
        updatePreferences({ practiceMode: newPracticeMode });
    }, [updatePreferences]);

    // Master mode: hidden target sum state
    const [targetRevealed, setTargetRevealed] = useState(false);

    // Grandmaster mode: optimization state
    const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('minimize');
    const [grandmasterFeedback, setGrandmasterFeedback] = useState<{
        isOptimal: boolean;
        currentSum: number;
        optimalSum: number;
        message: string;
    } | null>(null);

    // Calculate optimal sums for grandmaster mode
    const computedOptimalResult = useMemo(() => {
        if (difficulty !== 'grandmaster') return null;
        const searchRange = calculateSumSearchRange(puzzle.lines, puzzle.availableNumbers);
        return findOptimalSums(puzzle.nodes, puzzle.lines, puzzle.availableNumbers, searchRange);
    }, [difficulty, puzzle]);

    // Calculate used numbers
    const usedNumbers = useMemo(() => {
        const used = new Set<number>();
        nodeValues.forEach((val) => {
            if (val !== null) used.add(val);
        });
        return used;
    }, [nodeValues]);

    // Check if any lines have errors
    const hasErrors = useMemo(() => {
        return puzzle.lines.some((line) => {
            const status = getLineStatus(line, nodeValues, puzzle.targetSum);
            return status.status === 'incorrect' || status.status === 'overflow';
        });
    }, [puzzle, nodeValues]);

    // Count filled nodes
    const filledCount = useMemo(() => {
        let count = 0;
        nodeValues.forEach((val) => {
            if (val !== null) count++;
        });
        return count;
    }, [nodeValues]);

    // Get hints
    const conceptHints = useMemo(() =>
        getHints(puzzle.name),
        [puzzle.name]
    );

    const progressHint = useMemo(() =>
        getProgressHint(filledCount, puzzle.nodes.length, hasErrors),
        [filledCount, puzzle.nodes.length, hasErrors]
    );

    // Auditor: Find impossible lines (only compute when hints are shown)
    const impossibleLineIds = useMemo(() => {
        if (!showHints) return new Set<string>();
        return findImpossibleLines(puzzle.lines, nodeValues, puzzle.availableNumbers, puzzle.targetSum);
    }, [showHints, puzzle, nodeValues]);

    // Starter: Find best starting node (only compute when hints are shown)
    const starterHint = useMemo(() => {
        if (!showHints) return null;
        return findBestStartingNode(puzzle.nodes, puzzle.lines, nodeValues, puzzle.availableNumbers, puzzle.targetSum);
    }, [showHints, puzzle, nodeValues]);

    // Algebraist: Derive algebraic equations (especially useful in master mode)
    const algebraicHints = useMemo(() => {
        if (!showHints) return [];
        const isMasterMode = difficulty === 'master' && !targetRevealed;
        return deriveAlgebraicHints(puzzle.nodes, puzzle.lines, nodeValues, puzzle.targetSum, isMasterMode);
    }, [showHints, puzzle, nodeValues, difficulty, targetRevealed]);

    // Handle node click - opens the number picker
    const handleNodeClick = useCallback(({ nodeId, screenPosition }: { nodeId: string; screenPosition: { x: number; y: number } }) => {
        if (showTimeUp) return; // Can't play after time is up

        const node = puzzle.nodes.find((n) => n.id === nodeId);
        if (!node || node.isFixed) return;

        // Open picker at the node position
        setPickerState({ nodeId, position: screenPosition });
    }, [puzzle, showTimeUp]);

    // Handle number selection from picker
    const handlePickerSelect = useCallback((num: number) => {
        if (!pickerState) return;

        const placedNodeId = pickerState.nodeId;
        const newValues = new Map(nodeValues);
        newValues.set(placedNodeId, num);
        nodeValuesHistory.set(newValues);
        setPickerState(null);
        playSound('place');

        // Trigger sparkle animation
        setJustPlacedNodeId(placedNodeId);
        setTimeout(() => setJustPlacedNodeId(null), 500);

        // Check for grandmaster mode win (all lines equal, any valid sum)
        if (difficulty === 'grandmaster' && computedOptimalResult) {
            // Check if all lines have the same sum and are complete
            const lineSums: number[] = [];
            let allComplete = true;

            for (const line of puzzle.lines) {
                let sum = 0;
                let complete = true;
                for (const nodeId of line.nodeIds) {
                    const value = newValues.get(nodeId);
                    if (value === null || value === undefined) {
                        complete = false;
                        break;
                    }
                    sum += value;
                }
                if (complete) {
                    lineSums.push(sum);
                } else {
                    allComplete = false;
                }
            }

            // All lines complete and have the same sum
            if (allComplete && lineSums.length > 0 && lineSums.every(s => s === lineSums[0])) {
                pauseTimer();
                const feedback = checkOptimalSolution(newValues, puzzle.lines, computedOptimalResult, optimizationGoal);
                setGrandmasterFeedback(feedback);

                // Award stats for grandmaster completion
                handleCompletion({
                    gameId: 'magic-graph',
                    levelId: isDailyMode ? 'daily' : puzzle.name,
                    difficulty,
                    timeSeconds: elapsedTime,
                    practiceMode,
                    isOptimalSolution: feedback.isOptimal,
                });

                // Track daily challenge completion
                if (isDailyMode && !dailyCompleted) {
                    completeDailyChallenge('magic-graph', elapsedTime);
                    setDailyCompleted(true);
                }

                if (feedback.isOptimal) {
                    playSound('win');
                    showConfetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 },
                    });
                } else {
                    playSound('click'); // Still a valid solution, but not optimal
                }
                setTimeout(() => setShowWin(true), 300);
            }
        } else if (isPuzzleSolved(puzzle.lines, newValues, puzzle.targetSum)) {
            pauseTimer();

            // Award stats for completion
            handleCompletion({
                gameId: 'magic-graph',
                levelId: isDailyMode ? 'daily' : puzzle.name,
                difficulty,
                timeSeconds: elapsedTime,
                practiceMode,
            });

            // Track daily challenge completion
            if (isDailyMode && !dailyCompleted) {
                completeDailyChallenge('magic-graph', elapsedTime);
                setDailyCompleted(true);
            }

            playSound('win');
            showConfetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
            setTimeout(() => setShowWin(true), 300);
        }
    }, [pickerState, nodeValues, puzzle, nodeValuesHistory, difficulty, computedOptimalResult, optimizationGoal, pauseTimer, elapsedTime, practiceMode, handleCompletion, isDailyMode, dailyCompleted]);

    // Handle clearing a node value
    const handlePickerClear = useCallback(() => {
        if (!pickerState) return;

        const newValues = new Map(nodeValues);
        newValues.set(pickerState.nodeId, null);
        nodeValuesHistory.set(newValues);
        setPickerState(null);
    }, [pickerState, nodeValues, nodeValuesHistory]);

    // Close picker
    const handlePickerClose = useCallback(() => {
        setPickerState(null);
    }, []);

    // Generate random puzzle using Web Worker for non-blocking generation
    const handleRandomPuzzle = useCallback(async () => {
        setIsGenerating(true);

        try {
            // Master and grandmaster modes use hard difficulty for random puzzles
            const targetDifficulty = (difficulty === 'master' || difficulty === 'grandmaster') ? 'hard' : difficulty;
            const { basePuzzle, hintsToShow } = createRandomBasePuzzle(targetDifficulty);

            // Use Web Worker for the heavy solving step
            const randomPuzzle = await workerGeneratePuzzle(basePuzzle, hintsToShow);

            setPuzzle(randomPuzzle);

            const map = new Map<string, number | null>();
            randomPuzzle.nodes.forEach((n) => map.set(n.id, n.value));
            nodeValuesHistory.reset(map);
            setPickerState(null);
            setShowWin(false);
            setShowHints(false);
            setTargetRevealed(false); // Reset for master mode
            setGrandmasterFeedback(null); // Reset grandmaster feedback
            setShowUnsolvableButton(false); // Reset unsolvable button
            setUnsolvableFeedback(null); // Reset unsolvable feedback
            resetTimer();
        } catch (error) {
            console.error('Failed to generate random puzzle:', error);
        }
        setIsGenerating(false);
    }, [difficulty, resetTimer, nodeValuesHistory, workerGeneratePuzzle]);

    // Change difficulty - generates a random puzzle for the new difficulty
    const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
        setDifficulty(newDifficulty);
        // Master and grandmaster modes use hard puzzles
        const targetDifficulty = (newDifficulty === 'master' || newDifficulty === 'grandmaster') ? 'hard' : newDifficulty;
        const { basePuzzle, hintsToShow } = createRandomBasePuzzle(targetDifficulty);
        const newPuzzle = generatePuzzle(basePuzzle, hintsToShow);

        setPuzzle(newPuzzle);

        const map = new Map<string, number | null>();
        newPuzzle.nodes.forEach((n) => map.set(n.id, n.value));
        nodeValuesHistory.reset(map);
        setTargetRevealed(false); // Reset for master mode
        setGrandmasterFeedback(null); // Reset grandmaster feedback
        setShowUnsolvableButton(false); // Reset unsolvable button
        setUnsolvableFeedback(null); // Reset unsolvable feedback
        resetTimer();
    }, [resetTimer, nodeValuesHistory]);

    // Reset current puzzle
    const resetPuzzle = useCallback(() => {
        const map = new Map<string, number | null>();
        puzzle.nodes.forEach((n) => map.set(n.id, n.isFixed ? n.value : null));
        nodeValuesHistory.reset(map);
        setPickerState(null);
        setShowWin(false);
        setGrandmasterFeedback(null);
        setShowUnsolvableButton(false); // Reset unsolvable button
        setUnsolvableFeedback(null); // Reset unsolvable feedback
        resetTimer();
    }, [puzzle, resetTimer, nodeValuesHistory]);

    // Next puzzle - generates a new random puzzle
    const nextPuzzle = useCallback(() => {
        handleRandomPuzzle();
    }, [handleRandomPuzzle]);

    // Handle custom puzzle from TopologyEditor
    const handleCustomPuzzle = useCallback((customPuzzle: PuzzleConfig) => {
        setPuzzle(customPuzzle);
        const map = new Map<string, number | null>();
        customPuzzle.nodes.forEach((n) => map.set(n.id, n.value));
        nodeValuesHistory.reset(map);
        setShowEditor(false);
        setShowWin(false);
        setGrandmasterFeedback(null);
        setShowUnsolvableButton(false); // Reset unsolvable button
        setUnsolvableFeedback(null); // Reset unsolvable feedback
        resetTimer();
        playSound('click');
    }, [nodeValuesHistory, resetTimer]);

    return (
        <GameLayout
            title={t('title')}
            gameId="magic-graph"
            headerRight={
                <>
                    <HelpButton gameId="magic-graph" onShowTutorial={() => setShowTutorial(true)} />
                    <SoundToggle />
                </>
            }
        >
            <div className="mg-container mg-layout">
                {/* === MAIN AREA: Board and inventory === */}
                <div className="mg-main">
                    {/* Daily Challenge Badge */}
                    {isDailyMode && (
                        <div className="mg-daily">
                            <span>📅</span>
                            <span>{tc('daily.dailyChallenge')}</span>
                            {dailyCompleted && <span className="mg-daily__check">✓</span>}
                        </div>
                    )}

                    {/* Generation Loading */}
                    {isGenerating && (
                        <div className="mg-loading">
                            <div className="mg-loading__spinner">🔮</div>
                            <p>{tc('generatingPuzzle')}</p>
                        </div>
                    )}

                    {/* Game Board or Editor */}
                    {showEditor ? (
                        <TopologyEditor
                            onPuzzleCreated={handleCustomPuzzle}
                            onCancel={() => setShowEditor(false)}
                        />
                    ) : (
                        <div
                            ref={puzzleBoardRef}
                            className={`mg-board-wrapper ${!isPracticeMode && timeLeft <= 10 ? 'mg-board-wrapper--urgent' : ''}`}
                        >
                            <PuzzleBoard
                                nodes={puzzle.nodes}
                                lines={puzzle.lines}
                                nodeValues={nodeValues}
                                targetSum={puzzle.targetSum}
                                selectedNodeId={pickerState?.nodeId ?? null}
                                onNodeClick={handleNodeClick}
                                impossibleLineIds={impossibleLineIds}
                                recommendedNodeId={starterHint?.nodeId ?? null}
                                justPlacedNodeId={justPlacedNodeId}
                                isCompleted={showWin}
                            />
                        </div>
                    )}

                    {/* Number Picker Popup */}
                    {pickerState && (
                        <NumberPicker
                            availableNumbers={puzzle.availableNumbers}
                            usedNumbers={usedNumbers}
                            position={pickerState.position}
                            onSelect={handlePickerSelect}
                            onClose={handlePickerClose}
                            onClear={nodeValues.get(pickerState.nodeId) !== null ? handlePickerClear : undefined}
                            currentValue={nodeValues.get(pickerState.nodeId)}
                        />
                    )}

                    {/* Number Inventory (display-only reference) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <span className="game-info__label">{tc('availableNumbers')}</span>
                        <NumberInventory
                            availableNumbers={puzzle.availableNumbers}
                            usedNumbers={usedNumbers}
                            selectedNumber={null}
                            onSelectNumber={() => { }}
                        />
                    </div>
                </div>

                {/* === SIDEBAR: Controls and info === */}
                <div className="mg-sidebar">
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
                        disabled={showWin}
                    />

                    {/* Difficulty Selector (hidden in daily mode) */}
                    {!isDailyMode && (
                        <DifficultySelector
                            options={['easy', 'medium', 'hard', 'master', 'grandmaster']}
                            value={difficulty}
                            onChange={handleDifficultyChange}
                        />
                    )}

                    {/* Game Rules */}
                    <div className="mg-rules">
                        <span>📜</span> {t('rules')}
                    </div>

                    {/* Game Actions (hidden in daily mode) */}
                    {!isDailyMode && (
                        <div className="mg-levels">
                            <button
                                className="action action--secondary"
                                onClick={handleRandomPuzzle}
                                disabled={isGenerating || isWorkerBusy}
                            >
                                {isGenerating || isWorkerBusy ? `⏳ ${tc('generating')}` : `🎲 ${tc('buttons.newPuzzle')}`}
                            </button>
                            <button
                                className="action action--secondary"
                                onClick={() => setShowEditor(true)}
                            >
                                ✏️ {t('editor.openEditor')}
                            </button>
                        </div>
                    )}

                    {/* Puzzle Info */}
                <div className="game-info">
                    {difficulty === 'grandmaster' ? (
                        <>
                            {/* Grandmaster mode: Optimization goal selector */}
                            <div className="game-info__item">
                                <span className="game-info__label">{t('goal')}</span>
                                <div className="mode-toggle" role="group" aria-label="Optimization goal">
                                    <button
                                        className={`mode-toggle__btn ${optimizationGoal === 'minimize' ? 'mode-toggle__btn--active' : ''}`}
                                        onClick={() => setOptimizationGoal('minimize')}
                                        aria-pressed={optimizationGoal === 'minimize'}
                                    >
                                        📉 {t('minimize')}
                                    </button>
                                    <button
                                        className={`mode-toggle__btn ${optimizationGoal === 'maximize' ? 'mode-toggle__btn--active' : ''}`}
                                        onClick={() => setOptimizationGoal('maximize')}
                                        aria-pressed={optimizationGoal === 'maximize'}
                                    >
                                        📈 {t('maximize')}
                                    </button>
                                </div>
                            </div>
                            {/* Show valid sum range */}
                            {computedOptimalResult && (
                                <div className="game-info__item">
                                    <span className="game-info__label">{t('validRange')}</span>
                                    <span className="game-info__value">
                                        {computedOptimalResult.minSum} – {computedOptimalResult.maxSum}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="game-info__item">
                                <span className="game-info__label">{t('targetSum')}</span>
                                {difficulty === 'master' && !targetRevealed ? (
                                    <span className="game-info__value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <span>?</span>
                                        <button
                                            className="action action--secondary"
                                            onClick={() => setTargetRevealed(true)}
                                            title={t('revealTargetSum')}
                                            style={{ padding: 'var(--space-xs)' }}
                                        >
                                            👁️
                                        </button>
                                    </span>
                                ) : (
                                    <span className="game-info__value--accent">{puzzle.targetSum}</span>
                                )}
                            </div>
                            {difficulty === 'master' && (
                                <div className="game-info__item">
                                    <span className="game-info__label">{t('hint')}</span>
                                    <span className="game-info__value" style={{ fontSize: 'var(--text-sm)' }}>{t('allLinesSameValue')}</span>
                                </div>
                            )}
                        </>
                    )}
                    <div className="game-info__item">
                        <span className="game-info__label">{t('puzzle')}</span>
                        <span className="game-info__value">{puzzle.name}</span>
                    </div>
                    <div className="game-info__item">
                        <span className="game-info__label">{t('progress')}</span>
                        <span className="game-info__value">{filledCount}/{puzzle.nodes.length}</span>
                    </div>
                </div>

                    {/* Unsolvable Button (appears after 45 seconds for seeded puzzles) */}
                {showUnsolvableButton && !showWin && !showTimeUp && (
                    <div className="mg-unsolvable">
                        <button
                            className={`mg-unsolvable-btn ${unsolvableFeedback?.type === 'wrong' ? 'flash-shake' : ''}`}
                            onClick={handleDeclareUnsolvable}
                            disabled={unsolvableFeedback?.type === 'correct'}
                        >
                            🚫 {t('unsolvable.button', 'Declare Unsolvable')}
                        </button>
                        {unsolvableFeedback && (
                            <div className={`mg-unsolvable-feedback mg-unsolvable-feedback--${unsolvableFeedback.type}`}>
                                {unsolvableFeedback.type === 'correct' ? '✓' : '✗'} {unsolvableFeedback.message}
                            </div>
                        )}
                    </div>
                )}

                {/* Hint Toggle */}
                <button
                    className="action action--secondary"
                    onClick={() => setShowHints(!showHints)}
                >
                    💡 {showHints ? tc('buttons.hideHints') : tc('buttons.needHelp')}
                </button>

                {/* Hints Panel */}
                {showHints && (
                    <div className="mg-hints">
                        {/* Auditor Warning */}
                        {impossibleLineIds.size > 0 && (
                            <div className="mg-hint mg-hint--auditor">
                                <h4>⚠️ {t('hints.auditor.title')}</h4>
                                <p>
                                    {impossibleLineIds.size === 1
                                        ? t('hints.auditor.singleLine')
                                        : t('hints.auditor.multipleLines', { count: impossibleLineIds.size })
                                    }
                                </p>
                            </div>
                        )}
                        {/* Starter Hint */}
                        {starterHint && starterHint.validOptions.length > 0 && (
                            <div className="mg-hint mg-hint--starter">
                                <h4>💡 {t('hints.starter.title')}</h4>
                                <p>{starterHint.reason}</p>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{t('hints.starter.subtext')}</p>
                            </div>
                        )}
                        {/* Algebraist Hints */}
                        {algebraicHints.length > 0 && (
                            <div className="mg-hint">
                                <h4>📐 {t('hints.algebraist.title')}</h4>
                                {algebraicHints.map((hint, i) => (
                                    <div key={i} style={{ marginTop: 'var(--space-sm)' }}>
                                        <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{hint.equation}</code>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{hint.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mg-hint">
                            <h4>{progressHint.title}</h4>
                            <p>{progressHint.message}</p>
                        </div>
                        {conceptHints.map((hint, i) => (
                            <div key={i} className="mg-hint">
                                <h4>{hint.title}</h4>
                                <p>{hint.message}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="mg-actions">
                    <button
                        className="action action--secondary"
                        onClick={nodeValuesHistory.undo}
                        disabled={!nodeValuesHistory.canUndo}
                        title={`${t('undo')} (Ctrl+Z)`}
                    >
                        ↩️
                    </button>
                    <button
                        className="action action--secondary"
                        onClick={nodeValuesHistory.redo}
                        disabled={!nodeValuesHistory.canRedo}
                        title={`${t('redo')} (Ctrl+Y)`}
                    >
                        ↪️
                    </button>
                    <button className="action action--secondary" onClick={resetPuzzle}>
                        🔄 {tc('buttons.reset')}
                    </button>
                    <button className="action action--primary" onClick={nextPuzzle}>
                        {tc('buttons.nextPuzzle')} →
                    </button>
                </div>
                </div>
                {/* === END SIDEBAR === */}
            </div>

            {/* Win Modal - Centered */}
            {showWin && (
                <>
                    <div className="game-modal__backdrop" aria-hidden="true" />
                    <div
                        ref={gameModalRef}
                        className={`game-modal ${
                            difficulty === 'grandmaster' && grandmasterFeedback?.isOptimal
                                ? 'game-modal--optimal'
                                : ''
                        }`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="game-modal-title"
                    >
                        {difficulty === 'grandmaster' && grandmasterFeedback ? (
                            <>
                                {/* Grandmaster mode - show optimization info */}
                                <div className="game-modal__header">
                                    <h2 id="game-modal-title" className="game-modal__title">
                                        {grandmasterFeedback.isOptimal ? '🏆' : '✓'}{' '}
                                        {grandmasterFeedback.isOptimal
                                            ? t('win.grandmaster.optimal')
                                            : t('win.grandmaster.valid')}
                                    </h2>
                                    <span className="game-modal__time">{elapsedTime}s</span>
                                </div>

                                <div className="game-modal__stats">
                                    <span className="game-modal__stat">
                                        {grandmasterFeedback.currentSum} {t('yourSum')}
                                    </span>
                                    <span className="game-modal__stat-separator">vs</span>
                                    <span className="game-modal__stat">
                                        {grandmasterFeedback.optimalSum}{' '}
                                        {optimizationGoal === 'minimize' ? t('minimum') : t('maximum')}
                                    </span>
                                </div>

                                <div className="game-modal__actions">
                                    {!grandmasterFeedback.isOptimal && (
                                        <button className="action action--secondary" onClick={resetPuzzle}>
                                            {tc('buttons.tryAgain')}
                                        </button>
                                    )}
                                    <button className="action action--primary" onClick={nextPuzzle}>
                                        {tc('buttons.nextPuzzle')} →
                                    </button>
                                </div>

                                {!grandmasterFeedback.isOptimal && (
                                    <p className="game-modal__insight">
                                        💡 {t('win.grandmaster.tryAgain')}
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Normal mode - ultra minimal */}
                                <div className="game-modal__header">
                                    <h2 id="game-modal-title" className="game-modal__title">
                                        ✓ {t('win.title')}
                                    </h2>
                                    <span className="game-modal__time">{elapsedTime}s</span>
                                </div>

                                <div className="game-modal__actions">
                                    {isDailyMode ? (
                                        <a href="/math-games/" className="action action--primary">
                                            {tc('backToGames')}
                                        </a>
                                    ) : (
                                        <button className="action action--primary" onClick={nextPuzzle}>
                                            {tc('buttons.nextPuzzle')} →
                                        </button>
                                    )}
                                </div>

                                <p className="game-modal__insight">
                                    💡 {t('win.mathInsight', { nodeCount: puzzle.nodes.length, lineCount: puzzle.lines.length })}
                                </p>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Time Up Modal - Centered */}
            {showTimeUp && (
                <>
                    <div className="game-modal__backdrop" aria-hidden="true" />
                    <div
                        className="game-modal game-modal--lose"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="timeup-modal-title"
                    >
                        <div className="game-modal__header">
                            <h2 id="timeup-modal-title" className="game-modal__title game-modal__title--lose">
                                ⏰ {tc('timer.timeUp')}
                            </h2>
                        </div>

                        <div className="game-modal__actions">
                            <button className="action action--primary" onClick={resetPuzzle}>
                                {tc('buttons.tryAgain')}
                            </button>
                        </div>

                        <p className="game-modal__insight">
                            💡 {tc('timer.practiceMessage')}
                        </p>
                    </div>
                </>
            )}

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
                <MagicGraphTutorial onComplete={() => setShowTutorial(false)} />
            )}
        </GameLayout>
    );
}

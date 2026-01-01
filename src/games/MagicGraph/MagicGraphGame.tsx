import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { GameLayout, DifficultySelector, RankUpOverlay, AchievementToast, Timer, SoundToggle, PersonalBestIndicator, HelpButton } from '../../shared/components';
import { useGameTimer, useGameRewards, useSwipeNavigation, useAnnounce } from '../../shared/hooks';
import { usePlayer } from '../../shared/contexts';
import { playSound, showConfetti } from '../../shared/utils';
import { isDailyCompleted, completeDailyChallenge } from '../../shared/services/daily';
import { shouldShowTutorial } from '@/shared/services/tutorialProgress';
import { PuzzleBoard, NumberInventory, NumberPicker, TopologyEditor, MagicGraphTutorial } from './components';
import type { PuzzleConfig, Difficulty, OptimizationGoal } from './logic/types';
import { generatePuzzle, isPuzzleSolved, getLineStatus, findImpossibleLines, findBestStartingNode, deriveAlgebraicHints, findOptimalSums, checkOptimalSolution, calculateSumSearchRange } from './logic/solver';
import { puzzleTemplates, getHints, getProgressHint, createRandomBasePuzzle } from './logic/puzzles';
import { getDailyMagicGraphPuzzle } from './logic/seededGenerator';
import { useHistory, useWorkerSolver } from './hooks';
import './MagicGraph.css';

interface PickerState {
    nodeId: string;
    position: { x: number; y: number };
}

// Difficulty to hint count mapping
const DIFFICULTY_HINTS: Record<Difficulty, number> = { easy: 2, medium: 1, hard: 0, master: 0, grandmaster: 0 };

export function MagicGraphGame() {
    const { t } = useTranslation('magicGraph');
    const { t: tc } = useTranslation('common');
    const [searchParams] = useSearchParams();

    // Daily mode detection
    const isDailyMode = searchParams.get('daily') === 'true';
    const [dailyCompleted, setDailyCompleted] = useState(() => isDailyMode && isDailyCompleted('magic-graph'));

    const [difficulty, setDifficulty] = useState<Difficulty>(isDailyMode ? 'medium' : 'easy');
    const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);

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
        return generatePuzzle(puzzleTemplates[0], DIFFICULTY_HINTS.easy);
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

    // Filter puzzles by difficulty (master and grandmaster use hard puzzles)
    const filteredTemplates = useMemo(() => {
        const targetDifficulty = (difficulty === 'master' || difficulty === 'grandmaster') ? 'hard' : difficulty;
        return puzzleTemplates.filter(t => t.difficulty === targetDifficulty);
    }, [difficulty]);

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

    // Load new puzzle
    const loadTemplate = useCallback((index: number, templates: typeof puzzleTemplates) => {
        const template = templates[index];
        if (!template) return;

        setCurrentTemplateIndex(index);
        const newPuzzle = generatePuzzle(template, DIFFICULTY_HINTS[difficulty]);
        setPuzzle(newPuzzle);

        const map = new Map<string, number | null>();
        newPuzzle.nodes.forEach((n) => map.set(n.id, n.value));
        nodeValuesHistory.reset(map);
        setPickerState(null);
        setShowWin(false);
        setShowHints(false);
        setTargetRevealed(false); // Reset for master mode
        setGrandmasterFeedback(null); // Reset grandmaster feedback
        resetTimer();
    }, [difficulty, resetTimer, nodeValuesHistory]);

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
            resetTimer();
        } catch (error) {
            console.error('Failed to generate random puzzle:', error);
        }
        setIsGenerating(false);
    }, [difficulty, resetTimer, nodeValuesHistory, workerGeneratePuzzle]);

    // Change difficulty
    const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
        setDifficulty(newDifficulty);
        // Master and grandmaster modes use hard puzzles
        const targetDifficulty = (newDifficulty === 'master' || newDifficulty === 'grandmaster') ? 'hard' : newDifficulty;
        const newTemplates = puzzleTemplates.filter(t => t.difficulty === targetDifficulty);
        if (newTemplates.length > 0) {
            const template = newTemplates[0];
            const newPuzzle = generatePuzzle(template, DIFFICULTY_HINTS[newDifficulty]);

            setPuzzle(newPuzzle);
            setCurrentTemplateIndex(0);

            const map = new Map<string, number | null>();
            newPuzzle.nodes.forEach((n) => map.set(n.id, n.value));
            nodeValuesHistory.reset(map);
            setTargetRevealed(false); // Reset for master mode
            setGrandmasterFeedback(null); // Reset grandmaster feedback
            resetTimer();
        }
    }, [resetTimer, nodeValuesHistory]);

    // Reset current puzzle
    const resetPuzzle = useCallback(() => {
        const map = new Map<string, number | null>();
        puzzle.nodes.forEach((n) => map.set(n.id, n.isFixed ? n.value : null));
        nodeValuesHistory.reset(map);
        setPickerState(null);
        setShowWin(false);
        setGrandmasterFeedback(null);
        resetTimer();
    }, [puzzle, resetTimer, nodeValuesHistory]);

    // Next puzzle
    const nextPuzzle = useCallback(() => {
        const nextIndex = (currentTemplateIndex + 1) % filteredTemplates.length;
        loadTemplate(nextIndex, filteredTemplates);
    }, [currentTemplateIndex, filteredTemplates, loadTemplate]);

    // Previous puzzle
    const previousPuzzle = useCallback(() => {
        const prevIndex = (currentTemplateIndex - 1 + filteredTemplates.length) % filteredTemplates.length;
        loadTemplate(prevIndex, filteredTemplates);
    }, [currentTemplateIndex, filteredTemplates, loadTemplate]);

    // Swipe navigation for level selector (mobile)
    const { ref: levelSwipeRef, handlers: levelSwipeHandlers } = useSwipeNavigation({
        onNext: nextPuzzle,
        onPrevious: previousPuzzle,
        enabled: !isDailyMode && !showWin && !showTimeUp,
    });

    // Handle custom puzzle from TopologyEditor
    const handleCustomPuzzle = useCallback((customPuzzle: PuzzleConfig) => {
        setPuzzle(customPuzzle);
        const map = new Map<string, number | null>();
        customPuzzle.nodes.forEach((n) => map.set(n.id, n.value));
        nodeValuesHistory.reset(map);
        setShowEditor(false);
        setShowWin(false);
        setGrandmasterFeedback(null);
        resetTimer();
        playSound('click');
    }, [nodeValuesHistory, resetTimer]);

    return (
        <GameLayout
            title={t('title')}
            headerRight={
                <>
                    <HelpButton gameId="magic-graph" onShowTutorial={() => setShowTutorial(true)} />
                    <SoundToggle />
                </>
            }
        >
            <div className="puzzle-container">
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
                        {filteredTemplates.map((template, index) => (
                            <button
                                key={template.name}
                                className={`level-btn ${index === currentTemplateIndex ? 'level-btn--active' : ''}`}
                                onClick={() => loadTemplate(index, filteredTemplates)}
                            >
                                {template.name}
                            </button>
                        ))}
                        <button
                            className="btn btn--secondary"
                            onClick={handleRandomPuzzle}
                            disabled={isGenerating || isWorkerBusy}
                        >
                            {isGenerating || isWorkerBusy ? `⏳ ${tc('generating')}` : `🎲 ${tc('buttons.random')}`}
                        </button>
                        <button
                            className="btn btn--secondary"
                            onClick={() => setShowEditor(true)}
                        >
                            ✏️ {t('editor.openEditor')}
                        </button>
                    </div>
                )}

                {/* Generation Loading */}
                {isGenerating && (
                    <div className="generating-overlay">
                        <div className="generating-spinner">🔮</div>
                        <p>{tc('generatingPuzzle')}</p>
                    </div>
                )}

                {/* Puzzle Info */}
                <div className="puzzle-info">
                    {difficulty === 'grandmaster' ? (
                        <>
                            {/* Grandmaster mode: Optimization goal selector */}
                            <div className="puzzle-info__item puzzle-info__item--goal">
                                <span className="puzzle-info__label">{t('goal')}</span>
                                <div className="optimization-toggle" role="group" aria-label="Optimization goal">
                                    <button
                                        className={`opt-btn ${optimizationGoal === 'minimize' ? 'opt-btn--active' : ''}`}
                                        onClick={() => setOptimizationGoal('minimize')}
                                        aria-pressed={optimizationGoal === 'minimize'}
                                    >
                                        📉 {t('minimize')}
                                    </button>
                                    <button
                                        className={`opt-btn ${optimizationGoal === 'maximize' ? 'opt-btn--active' : ''}`}
                                        onClick={() => setOptimizationGoal('maximize')}
                                        aria-pressed={optimizationGoal === 'maximize'}
                                    >
                                        📈 {t('maximize')}
                                    </button>
                                </div>
                            </div>
                            {/* Show valid sum range */}
                            {computedOptimalResult && (
                                <div className="puzzle-info__item puzzle-info__item--range">
                                    <span className="puzzle-info__label">{t('validRange')}</span>
                                    <span className="puzzle-info__value puzzle-info__value--range">
                                        {computedOptimalResult.minSum} – {computedOptimalResult.maxSum}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="puzzle-info__item">
                                <span className="puzzle-info__label">{t('targetSum')}</span>
                                {difficulty === 'master' && !targetRevealed ? (
                                    <span className="puzzle-info__value puzzle-info__value--mystery">
                                        <span className="mystery-value">?</span>
                                        <button
                                            className="btn btn--tiny btn--ghost"
                                            onClick={() => setTargetRevealed(true)}
                                            title={t('revealTargetSum')}
                                        >
                                            👁️
                                        </button>
                                    </span>
                                ) : (
                                    <span className="puzzle-info__value puzzle-info__value--glow">{puzzle.targetSum}</span>
                                )}
                            </div>
                            {difficulty === 'master' && (
                                <div className="puzzle-info__item puzzle-info__item--hint">
                                    <span className="puzzle-info__label">{t('hint')}</span>
                                    <span className="puzzle-info__value puzzle-info__value--small">{t('allLinesSameValue')}</span>
                                </div>
                            )}
                        </>
                    )}
                    <div className="puzzle-info__item">
                        <span className="puzzle-info__label">{t('puzzle')}</span>
                        <span className="puzzle-info__value">{puzzle.name}</span>
                    </div>
                    <div className="puzzle-info__item">
                        <span className="puzzle-info__label">{t('progress')}</span>
                        <span className="puzzle-info__value">{filledCount}/{puzzle.nodes.length}</span>
                    </div>
                </div>

                {/* Game Board or Editor */}
                {showEditor ? (
                    <TopologyEditor
                        onPuzzleCreated={handleCustomPuzzle}
                        onCancel={() => setShowEditor(false)}
                    />
                ) : (
                    <div className={`board-wrapper ${!isPracticeMode && timeLeft <= 10 ? 'board-wrapper--urgent' : ''}`}>
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
                <div className="number-inventory-wrapper">
                    <span className="inventory-label">{tc('availableNumbers')}</span>
                    <NumberInventory
                        availableNumbers={puzzle.availableNumbers}
                        usedNumbers={usedNumbers}
                        selectedNumber={null}
                        onSelectNumber={() => { }}
                    />
                </div>

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
                        {/* Auditor Warning */}
                        {impossibleLineIds.size > 0 && (
                            <div className="hint-card hint-card--auditor">
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
                            <div className="hint-card hint-card--starter">
                                <h4>💡 {t('hints.starter.title')}</h4>
                                <p>{starterHint.reason}</p>
                                <p className="hint-card__subtext">{t('hints.starter.subtext')}</p>
                            </div>
                        )}
                        {/* Algebraist Hints */}
                        {algebraicHints.length > 0 && (
                            <div className="hint-card hint-card--algebraist">
                                <h4>📐 {t('hints.algebraist.title')}</h4>
                                {algebraicHints.map((hint, i) => (
                                    <div key={i} className="algebra-hint">
                                        <code className="algebra-equation">{hint.equation}</code>
                                        <p className="algebra-explanation">{hint.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="hint-card hint-card--progress">
                            <h4>{progressHint.title}</h4>
                            <p>{progressHint.message}</p>
                        </div>
                        {conceptHints.map((hint, i) => (
                            <div key={i} className={`hint-card hint-card--${hint.type}`}>
                                <h4>{hint.title}</h4>
                                <p>{hint.message}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="puzzle-actions">
                    <button
                        className="btn btn--icon"
                        onClick={nodeValuesHistory.undo}
                        disabled={!nodeValuesHistory.canUndo}
                        title={`${t('undo')} (Ctrl+Z)`}
                    >
                        ↩️
                    </button>
                    <button
                        className="btn btn--icon"
                        onClick={nodeValuesHistory.redo}
                        disabled={!nodeValuesHistory.canRedo}
                        title={`${t('redo')} (Ctrl+Y)`}
                    >
                        ↪️
                    </button>
                    <button className="btn btn--secondary" onClick={resetPuzzle}>
                        🔄 {tc('buttons.reset')}
                    </button>
                    <button className="btn btn--primary" onClick={nextPuzzle}>
                        {tc('buttons.nextPuzzle')} →
                    </button>
                </div>
            </div>

            {/* Win Overlay */}
            {showWin && (
                <div className={`win-overlay ${difficulty === 'grandmaster' && grandmasterFeedback?.isOptimal ? 'win-overlay--optimal' : ''}`}>
                    {difficulty === 'grandmaster' && grandmasterFeedback ? (
                        <>
                            {/* Grandmaster mode win */}
                            <div className="win-overlay__confetti">
                                {grandmasterFeedback.isOptimal ? '🏆' : '✓'}
                            </div>
                            <h2 className="win-overlay__title">
                                {grandmasterFeedback.isOptimal ? `🎯 ${t('win.grandmaster.optimal')}` : `✅ ${t('win.grandmaster.valid')}`}
                            </h2>
                            <p className="win-overlay__message win-overlay__message--feedback">
                                {grandmasterFeedback.message}
                            </p>
                            <div className="win-overlay__stats">
                                <div className="stat">
                                    <span className="stat__value">{grandmasterFeedback.currentSum}</span>
                                    <span className="stat__label">{t('yourSum')}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat__value">{grandmasterFeedback.optimalSum}</span>
                                    <span className="stat__label">{optimizationGoal === 'minimize' ? t('minimum') : t('maximum')}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat__value">{elapsedTime}s</span>
                                    <span className="stat__label">{tc('stats.time')}</span>
                                </div>
                            </div>
                            {!grandmasterFeedback.isOptimal && (
                                <p className="win-overlay__tip win-overlay__tip--try-again">
                                    💡 {t('win.grandmaster.tryAgain')}
                                </p>
                            )}
                            <div className="win-overlay__actions">
                                {!grandmasterFeedback.isOptimal && (
                                    <button className="btn btn--secondary btn--large" onClick={resetPuzzle}>
                                        🔄 {tc('buttons.tryAgain')}
                                    </button>
                                )}
                                <button className="btn btn--primary btn--large" onClick={nextPuzzle}>
                                    {tc('buttons.nextPuzzle')} →
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Normal mode win */}
                            <div className="win-overlay__confetti">🎊</div>
                            <h2 className="win-overlay__title">🎉 {t('win.title')}</h2>
                            <p className="win-overlay__message">
                                {t('win.message', { sum: puzzle.targetSum })}
                            </p>
                            <div className="win-overlay__stats">
                                <div className="stat">
                                    <span className="stat__value">{elapsedTime}s</span>
                                    <span className="stat__label">{tc('stats.time')}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat__value">{puzzle.nodes.length}</span>
                                    <span className="stat__label">{tc('stats.nodes')}</span>
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
                            <p className="win-overlay__tip">
                                💡 {t('win.mathInsight', { nodeCount: puzzle.nodes.length, lineCount: puzzle.lines.length })}
                            </p>
                            {/* In daily mode, show Back to Games; otherwise show Next Puzzle */}
                            {isDailyMode ? (
                                <a href="/math-games/" className="btn btn--primary btn--large">
                                    {tc('backToGames')}
                                </a>
                            ) : (
                                <button className="btn btn--primary btn--large" onClick={nextPuzzle}>
                                    {tc('buttons.nextPuzzle')} →
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Time Up Overlay */}
            {showTimeUp && (
                <div className="time-up-overlay">
                    <h2 className="time-up-overlay__title">⏰ {tc('timer.timeUp')}</h2>
                    <p className="time-up-overlay__message">
                        {tc('timer.practiceMessage')}
                    </p>
                    <div className="game-actions">
                        <button className="btn btn--primary" onClick={resetPuzzle}>
                            {tc('buttons.tryAgain')}
                        </button>
                        <button className="btn btn--secondary" onClick={nextPuzzle}>
                            {tc('buttons.skipPuzzle')}
                        </button>
                    </div>
                </div>
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

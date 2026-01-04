import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { GameState, Position3D, RotationAxis, LevelConfig } from '../logic/types';
import { DEFAULT_ROTATION } from '../logic/types';
import { createGameState, rotateBy90OnAxis } from '../logic/engine';
import { presetLevels, generateRandomLevel } from '../logic/presets';
import { getDailyShapeArchitectLevel } from '../logic/seededGenerator';

export interface UseShapeArchitectStateOptions {
    isDailyMode?: boolean;
    initialDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface PlacementModalState {
    isOpen: boolean;
    targetPosition: Position3D | null;
    rotation: { x: number; y: number; z: number };
}

export interface UseShapeArchitectStateReturn {
    // State
    gameState: GameState;
    currentLevelIndex: number;
    difficulty: 'easy' | 'medium' | 'hard';
    filteredLevels: LevelConfig[];
    selectedPiece: ReturnType<typeof getSelectedPiece>;
    viewMode: '2d' | '3d';

    // Preview lock state
    previewLocked: boolean;
    lockedPosition: Position3D | null;
    hoverPosition: Position3D | null;
    effectivePreviewPosition: Position3D | null;

    // Placement modal state
    placementModal: PlacementModalState;

    // Actions
    handleSelectPiece: (pieceId: string) => void;
    handleRotateAxis: (axis: RotationAxis) => void;
    loadLevel: (index: number, levels?: LevelConfig[]) => void;
    resetLevel: () => void;
    nextLevel: () => void;
    previousLevel: () => void;
    startRandomLevel: () => void;
    setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
    setViewMode: (mode: '2d' | '3d') => void;
    togglePreviewLock: () => void;
    setHoverPosition: (position: Position3D | null) => void;

    // Placement modal actions
    openPlacementModal: (position: Position3D) => void;
    closePlacementModal: () => void;
    rotateModalPiece: (axis: RotationAxis) => void;

    // Setters for external state management
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

function getSelectedPiece(gameState: GameState) {
    return gameState.remainingPieces.find(
        (p) => p.id === gameState.selectedPieceId
    ) ?? null;
}

export function useShapeArchitectState(
    options: UseShapeArchitectStateOptions = {}
): UseShapeArchitectStateReturn {
    const { isDailyMode = false, initialDifficulty = 'easy' } = options;

    // Daily level ref (cached for session)
    const dailyLevelRef = useRef(isDailyMode ? getDailyShapeArchitectLevel() : null);

    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [difficulty, setDifficultyState] = useState<'easy' | 'medium' | 'hard'>(
        isDailyMode ? 'medium' : initialDifficulty
    );
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

    // Preview lock state
    const [previewLocked, setPreviewLocked] = useState(false);
    const [lockedPosition, setLockedPosition] = useState<Position3D | null>(null);
    const [hoverPosition, setHoverPosition] = useState<Position3D | null>(null);

    // Placement modal state
    const [placementModal, setPlacementModal] = useState<PlacementModalState>({
        isOpen: false,
        targetPosition: null,
        rotation: { x: 0, y: 0, z: 0 },
    });

    // Filter levels by difficulty
    const filteredLevels = useMemo(() =>
        presetLevels.filter(l => l.difficulty === difficulty),
        [difficulty]
    );

    const [gameState, setGameState] = useState<GameState>(() => {
        if (isDailyMode && dailyLevelRef.current) {
            return createGameState(dailyLevelRef.current);
        }
        // Generate random puzzle on mount (no preset levels)
        return createGameState(generateRandomLevel(initialDifficulty));
    });

    // Get selected piece
    const selectedPiece = getSelectedPiece(gameState);

    // Effective preview position (locked or hover)
    const effectivePreviewPosition = previewLocked ? lockedPosition : hoverPosition;

    // Auto-select first piece when level loads
    useEffect(() => {
        if (gameState.remainingPieces.length > 0 && !gameState.selectedPieceId) {
            setGameState(prev => ({
                ...prev,
                selectedPieceId: prev.remainingPieces[0].id
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.level.id]);

    // Handle piece selection
    const handleSelectPiece = useCallback((pieceId: string) => {
        setGameState((prev) => ({
            ...prev,
            selectedPieceId: prev.selectedPieceId === pieceId ? null : pieceId,
            rotation: { ...DEFAULT_ROTATION },
        }));
        // Clear preview lock when selecting new piece
        setPreviewLocked(false);
        setLockedPosition(null);
    }, []);

    // Handle rotation on specific axis
    const handleRotateAxis = useCallback((axis: RotationAxis) => {
        setGameState((prev) => ({
            ...prev,
            rotation: rotateBy90OnAxis(prev.rotation, axis),
        }));
    }, []);

    // Load level
    const loadLevel = useCallback((index: number, levels?: LevelConfig[]) => {
        const levelList = levels || filteredLevels;
        const level = levelList[index];
        if (!level) return;
        setCurrentLevelIndex(index);
        setGameState(createGameState(level));
        // Auto-switch view mode based on level type
        setViewMode(level.type === '3D' ? '3d' : '2d');
        // Clear preview lock
        setPreviewLocked(false);
        setLockedPosition(null);
        setHoverPosition(null);
        // Close placement modal
        setPlacementModal({ isOpen: false, targetPosition: null, rotation: { x: 0, y: 0, z: 0 } });
    }, [filteredLevels]);

    // Reset current level
    const resetLevel = useCallback(() => {
        setGameState(createGameState(gameState.level));
        setPreviewLocked(false);
        setLockedPosition(null);
        // Close placement modal
        setPlacementModal({ isOpen: false, targetPosition: null, rotation: { x: 0, y: 0, z: 0 } });
    }, [gameState.level]);

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

    // Random level
    const startRandomLevel = useCallback(() => {
        const level = generateRandomLevel(difficulty);
        setGameState(createGameState(level));
        setViewMode(level.type === '3D' ? '3d' : '2d');
        setPreviewLocked(false);
        setLockedPosition(null);
        // Close placement modal
        setPlacementModal({ isOpen: false, targetPosition: null, rotation: { x: 0, y: 0, z: 0 } });
    }, [difficulty]);

    // Change difficulty - generates a new random puzzle
    const setDifficulty = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
        setDifficultyState(newDifficulty);
        // Generate a new random puzzle for the new difficulty
        const level = generateRandomLevel(newDifficulty);
        setGameState(createGameState(level));
        setViewMode(level.type === '3D' ? '3d' : '2d');
        setPreviewLocked(false);
        setLockedPosition(null);
        // Close placement modal
        setPlacementModal({ isOpen: false, targetPosition: null, rotation: { x: 0, y: 0, z: 0 } });
    }, []);

    // Toggle preview lock
    const togglePreviewLock = useCallback(() => {
        if (previewLocked) {
            setPreviewLocked(false);
            setLockedPosition(null);
        } else if (hoverPosition) {
            setPreviewLocked(true);
            setLockedPosition(hoverPosition);
        }
    }, [previewLocked, hoverPosition]);

    // Open placement modal with current rotation
    const openPlacementModal = useCallback((position: Position3D) => {
        setPlacementModal({
            isOpen: true,
            targetPosition: position,
            rotation: { ...gameState.rotation },
        });
    }, [gameState.rotation]);

    // Close placement modal
    const closePlacementModal = useCallback(() => {
        setPlacementModal({
            isOpen: false,
            targetPosition: null,
            rotation: { x: 0, y: 0, z: 0 },
        });
    }, []);

    // Rotate piece in modal
    const rotateModalPiece = useCallback((axis: RotationAxis) => {
        setPlacementModal(prev => ({
            ...prev,
            rotation: rotateBy90OnAxis(prev.rotation, axis),
        }));
    }, []);

    return {
        gameState,
        currentLevelIndex,
        difficulty,
        filteredLevels,
        selectedPiece,
        viewMode,
        previewLocked,
        lockedPosition,
        hoverPosition,
        effectivePreviewPosition,
        placementModal,
        handleSelectPiece,
        handleRotateAxis,
        loadLevel,
        resetLevel,
        nextLevel,
        previousLevel,
        startRandomLevel,
        setDifficulty,
        setViewMode,
        togglePreviewLock,
        setHoverPosition,
        openPlacementModal,
        closePlacementModal,
        rotateModalPiece,
        setGameState,
    };
}

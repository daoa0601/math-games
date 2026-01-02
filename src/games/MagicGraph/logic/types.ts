// ========================================
// Magic Graph - Type Definitions
// ========================================

export interface Position {
    x: number;
    y: number;
}

export interface GraphNode {
    id: string;
    position: Position;
    value: number | null;  // null means empty
    isFixed: boolean;      // pre-filled nodes
}

export interface Line {
    id: string;
    nodeIds: string[];     // IDs of nodes in this line
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'master' | 'grandmaster';

export type OptimizationGoal = 'minimize' | 'maximize';

export interface PuzzleConfig {
    id: string;
    name: string;
    nodes: GraphNode[];
    lines: Line[];
    targetSum: number;
    availableNumbers: number[];
    difficulty: Difficulty;
    /** Whether this puzzle has a valid solution (default: true) */
    isSolvable?: boolean;
}

export interface PuzzleState {
    config: PuzzleConfig;
    currentValues: Map<string, number | null>;
    selectedNumber: number | null;
}

// Line status for visual feedback
export type LineStatus = 'incomplete' | 'correct' | 'incorrect' | 'overflow';

export interface LineWithStatus extends Line {
    status: LineStatus;
    currentSum: number;
    filledCount: number;
}

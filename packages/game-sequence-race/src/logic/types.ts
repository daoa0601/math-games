// ========================================
// Sequence Sprinter - Type Definitions
// ========================================

export type SequenceType =
  | 'arithmetic'
  | 'geometric'
  | 'fibonacci'
  | 'prime'
  | 'square'
  | 'triangular'
  | 'powers3'

/** Game mode - vs AI or two-player local */
export type GameMode = 'vs-ai' | 'two-player'

/** Player identifier - player1 is always first, player2 or ai is second */
export type Player = 'player1' | 'player2' | 'ai'

export interface SequenceState {
  target: number
  currentPosition: number
  availableSteps: number[]
  /** Current turn - 'player' for solo races, or specific player in two-player mode */
  turn: 'player' | 'ai' | 'player1' | 'player2'
  history: HistoryEntry[]
  /** Winner - null if game not over */
  winner: 'player' | 'ai' | 'player1' | 'player2' | null
  gameOver: boolean
  /** Game mode - defaults to 'vs-ai' */
  mode: GameMode
}

export interface HistoryEntry {
  actor: 'player' | 'ai' | 'player1' | 'player2'
  step: number
  position: number
}

export interface GameConfig {
  id: string
  name: string
  target: number
  stepPool: number[]
  difficulty: 'easy' | 'medium' | 'hard'
  sequenceType?: SequenceType
  /** Game mode - defaults to 'vs-ai' */
  mode?: GameMode
  /** If true, AI moves first (player has second-mover advantage) */
  aiMovesFirst?: boolean
}

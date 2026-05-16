import type {
  Achievement,
  AchievementContext,
  DailyChallengePick,
  GameFeedback,
  GameModule,
  GameProgressInput,
  ScoreContext,
} from '@math-games/core'
import { createValidateAndComputeScore } from '@math-games/core'
import { shapeArchitectTranslations } from './translations'

import { canPlacePiece, checkSolved, initializeGrid, placePiece } from './logic'
import type { LevelConfig, PlacedPiece, Rotation3D } from './logic'
import { ShapeArchitectCompletion as ShapeArchitectCompletionSchema } from './schema'
import {
  getShapeArchitectCatalog,
  getShapeArchitectPracticeConfig,
} from './catalog'
import type { ShapeArchitectPracticeDifficulty } from './catalog'

const difficulties = ['easy', 'medium', 'hard', 'expert', 'master'] as const

const practiceDifficulties: readonly ShapeArchitectPracticeDifficulty[] = [
  'easy',
  'medium',
  'hard',
]

const practiceIdPattern = /^practice_(easy|medium|hard)_(.+)$/

const MAX_PLACEMENTS = 64

export interface ShapeArchitectCompletion {
  placements: PlacedPiece[]
}

const achievements: readonly Achievement[] = [
  {
    id: 'sa_first_build',
    category: 'shape-architect',
    name: 'First Build',
    description: 'Complete a Shape Architect puzzle.',
    rarity: 'common',
  },
  {
    id: 'sa_master_architect',
    category: 'shape-architect',
    name: 'Master Architect',
    description: 'Complete a master Shape Architect puzzle.',
    rarity: 'epic',
  },
]

function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: ReadonlySet<string>,
): string[] {
  const newly: string[] = []

  if (ctx.completed && !unlocked.has('sa_first_build')) {
    newly.push('sa_first_build')
  }

  if (
    ctx.completed &&
    ctx.difficulty === 'master' &&
    !unlocked.has('sa_master_architect')
  ) {
    newly.push('sa_master_architect')
  }

  return newly
}

const cachedCatalog = getShapeArchitectCatalog()
const cachedGetCatalog = () => cachedCatalog

function getDailyPick(hash: number): DailyChallengePick {
  const { configs } = cachedCatalog
  const config = configs[hash % configs.length]

  return {
    levelId: config.id,
    title: config.name,
    difficulty: config.difficulty,
  }
}

function computeScore({ completed, moves }: ScoreContext) {
  return completed ? Math.max(20, 100 - moves * 5) : 10
}

function progressExtras(_input: GameProgressInput) {
  return {}
}

function resolveLevelConfig(levelId: string): LevelConfig | null {
  const preset = cachedCatalog.configs.find(
    (candidate) => candidate.id === levelId,
  )

  if (preset) return preset

  const match = levelId.match(practiceIdPattern)

  if (!match) return null

  const difficulty = match[1] as ShapeArchitectPracticeDifficulty

  if (!practiceDifficulties.includes(difficulty)) return null

  return getShapeArchitectPracticeConfig(match[2], difficulty)
}

function isValidPosition(
  value: unknown,
): value is { x: number; y: number; z: number } {
  if (value === null || typeof value !== 'object') return false

  const { x, y, z } = value as Record<string, unknown>

  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    typeof z === 'number' &&
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    Number.isInteger(z)
  )
}

function isValidRotation(value: unknown): value is Rotation3D {
  if (!isValidPosition(value)) return false
  const { x, y, z } = value

  return (
    [0, 90, 180, 270].includes(x) &&
    [0, 90, 180, 270].includes(y) &&
    [0, 90, 180, 270].includes(z)
  )
}

function validateGameState(
  level: LevelConfig,
  raw: unknown,
): { completed: boolean; moves: number; feedback?: GameFeedback } | null {
  if (raw === null || typeof raw !== 'object') return null

  const completion = raw as Partial<ShapeArchitectCompletion>

  if (!Array.isArray(completion.placements)) return null
  if (completion.placements.length > MAX_PLACEMENTS) return null

  let grid = initializeGrid(level)
  const usedPieceIds = new Set<string>()

  for (const placement of completion.placements as unknown[]) {
    if (placement === null || typeof placement !== 'object') return null

    const pieceId = (placement as { pieceId?: unknown }).pieceId
    const position = (placement as { position?: unknown }).position
    const rotation = (placement as { rotation?: unknown }).rotation

    if (typeof pieceId !== 'string') return null
    if (!isValidPosition(position)) return null
    if (!isValidRotation(rotation)) return null
    if (usedPieceIds.has(pieceId)) return null

    const piece = level.pieces.find((candidate) => candidate.id === pieceId)

    if (!piece) return null
    if (!canPlacePiece(grid, piece, position, rotation, level.gridSize)) {
      return null
    }

    grid = placePiece(grid, piece, position, rotation)
    usedPieceIds.add(pieceId)
  }

  const completed = checkSolved(grid, level.targetVoxels)
  const moves = completion.placements.length

  if (!completed && moves > 0) {
    return {
      completed,
      moves,
      feedback: {
        kind: 'generic' as const,
        message: 'Not all target cells are covered.',
      },
    }
  }

  return { completed, moves }
}

export const shapeArchitectModule = {
  id: 'shape-architect',
  route: '/games/shape-architect',
  title: 'Shape Architect',
  description: 'Dissection puzzles built from portable geometry logic.',
  difficulties,
  achievements,
  translations: shapeArchitectTranslations,
  levelCount: cachedCatalog.configs.length,
  getCatalog: cachedGetCatalog,
  getDailyPick,
  computeScore,
  evaluateAchievements,
  validateAndComputeScore: createValidateAndComputeScore({
    completionSchema: ShapeArchitectCompletionSchema,
    resolveLevelConfig,
    validateGameState,
    computeScore,
    progressExtras,
  }),
  progressExtras,
  resolveLevelConfig,
  validateGameState,
} as const satisfies GameModule<LevelConfig>

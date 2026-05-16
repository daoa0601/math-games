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
import { magicGraphTranslations } from './translations'

import { getLineStatus, isPuzzleSolved } from './logic'
import type { PuzzleConfig } from './logic'
import { MagicGraphCompletion as MagicGraphCompletionSchema } from './schema'
import {
  getMagicGraphCatalog,
  getMagicGraphPracticeConfig,
} from './catalog'
import type { MagicGraphPracticeDifficulty } from './catalog'

const difficulties = [
  'easy',
  'medium',
  'hard',
  'master',
  'grandmaster',
] as const

const practiceDifficulties: readonly MagicGraphPracticeDifficulty[] = [
  'easy',
  'medium',
  'hard',
]

const practiceIdPattern = /^practice_(easy|medium|hard)_(.+)$/

export interface MagicGraphCompletion {
  nodeValues: Record<string, number | null>
}

const achievements: readonly Achievement[] = [
  {
    id: 'mg_first_solve',
    category: 'magic-graph',
    name: 'First Solve',
    description: 'Solve a Magic Graph puzzle.',
    rarity: 'common',
  },
  {
    id: 'mg_grandmaster',
    category: 'magic-graph',
    name: 'Magic Grandmaster',
    description: 'Solve a grandmaster Magic Graph puzzle optimally.',
    rarity: 'epic',
  },
]

function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: ReadonlySet<string>,
): string[] {
  const newly: string[] = []

  if (ctx.completed && !unlocked.has('mg_first_solve')) {
    newly.push('mg_first_solve')
  }

  if (
    ctx.completed &&
    ctx.difficulty === 'grandmaster' &&
    ctx.isOptimalSolution === true &&
    !unlocked.has('mg_grandmaster')
  ) {
    newly.push('mg_grandmaster')
  }

  return newly
}

// Memoize: getMagicGraphCatalog builds a fresh array on each call; capture
// once at module load so the registry/server handlers reuse the same object.
const cachedCatalog = getMagicGraphCatalog()
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

function progressExtras(input: GameProgressInput) {
  return { isOptimalSolution: input.completed && input.score >= 100 }
}

function resolveLevelConfig(levelId: string): PuzzleConfig | null {
  const preset = cachedCatalog.configs.find(
    (candidate) => candidate.id === levelId,
  )

  if (preset) return preset

  const match = levelId.match(practiceIdPattern)

  if (!match) return null

  const difficulty = match[1] as MagicGraphPracticeDifficulty

  if (!practiceDifficulties.includes(difficulty)) return null

  return getMagicGraphPracticeConfig(match[2], difficulty)
}

function validateGameState(
  level: PuzzleConfig,
  raw: unknown,
): { completed: boolean; moves: number; feedback?: GameFeedback } | null {
  if (raw === null || typeof raw !== 'object') return null

  const completion = raw as Partial<MagicGraphCompletion>

  const rawNodeValues: unknown = completion.nodeValues
  if (
    rawNodeValues === null ||
    typeof rawNodeValues !== 'object'
  ) {
    return null
  }

  const nodeValues = rawNodeValues as Record<string, number>
  const allowedNumbers = new Set(level.availableNumbers)
  const valueMap = new Map<string, number | null>()
  const usedNumbers = new Set<number>()

  for (const node of level.nodes) {
    const value = Object.hasOwn(nodeValues, node.id)
      ? nodeValues[node.id]
      : null

    if (node.isFixed) {
      if (value !== null && value !== node.value) return null
      valueMap.set(node.id, node.value)
      continue
    }

    if (value === null) {
      valueMap.set(node.id, null)
      continue
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) return null
    if (!allowedNumbers.has(value)) return null
    if (usedNumbers.has(value)) return null

    usedNumbers.add(value)
    valueMap.set(node.id, value)
  }

  const completed = isPuzzleSolved(level.lines, valueMap, level.targetSum)
  const filled = Array.from(valueMap.values()).filter(
    (value) => value !== null,
  ).length
  const moves = Math.max(0, filled - 1)

  if (!completed) {
    for (let i = 0; i < level.lines.length; i++) {
      const ls = getLineStatus(level.lines[i], valueMap, level.targetSum)
      if (ls.status === 'incorrect') {
        return {
          completed,
          moves,
          feedback: {
            kind: 'wrong-line' as const,
            lineIndex: i,
            actual: ls.currentSum,
            target: level.targetSum,
          },
        }
      }
    }
  }

  return { completed, moves }
}

export const magicGraphModule = {
  id: 'magic-graph',
  route: '/games/magic-graph',
  title: 'Magic Graph',
  description: 'Line-sum puzzles with seeded practice.',
  difficulties,
  achievements,
  translations: magicGraphTranslations,
  levelCount: cachedCatalog.configs.length,
  getCatalog: cachedGetCatalog,
  getDailyPick,
  computeScore,
  evaluateAchievements,
  validateAndComputeScore: createValidateAndComputeScore({
    completionSchema: MagicGraphCompletionSchema,
    resolveLevelConfig,
    validateGameState,
    computeScore,
    progressExtras,
  }),
  progressExtras,
  resolveLevelConfig,
  validateGameState,
} as const satisfies GameModule<PuzzleConfig>

import type { AchievementRarity, GameId } from '@/games/game-module'

import { t, tx } from './translations'
import type { Locale } from './translations'

const gameTitleKeys: Record<GameId, Parameters<typeof t>[1]> = {
  'magic-graph': 'gameTitle.magicGraph',
  'sequence-race': 'gameTitle.sequenceRace',
  'shape-architect': 'gameTitle.shapeArchitect',
}

const gameDescriptionKeys: Record<GameId, Parameters<typeof t>[1]> = {
  'magic-graph': 'gameDescription.magicGraph',
  'sequence-race': 'gameDescription.sequenceRace',
  'shape-architect': 'gameDescription.shapeArchitect',
}

const levelNameKeys = new Map<string, Parameters<typeof t>[1]>([
  ['Line of Three', 'level.lineOfThree'],
  ['Cross', 'level.cross'],
  ['Magic Triangle', 'level.magicTriangle'],
  ['Diamond', 'level.diamond'],
  ['Magic Square 3×3', 'level.magicSquare3x3'],
  ['Counting Numbers', 'level.countingNumbers'],
  ['Powers of 2', 'level.powersOf2'],
  ['Fibonacci Sequence', 'level.fibonacciSequence'],
  ['Prime Numbers', 'level.primeNumbers'],
  ['Perfect Squares', 'level.perfectSquares'],
  ['Triangular Numbers', 'level.triangularNumbers'],
  ['Powers of 3', 'level.powersOf3'],
  ['Count to 10', 'level.countTo10'],
  ['Count to 15', 'level.countTo15'],
  ['Fibonacci Race', 'level.fibonacciRace'],
  ['Binary Sprint', 'level.binarySprint'],
  ['Prime Time', 'level.primeTime'],
  ['Square Race', 'level.squareRace'],
  ['Golden Ratio', 'level.goldenRatio'],
  ['Triangle Count', 'level.triangleCount'],
  ['Pyramid Race', 'level.pyramidRace'],
  ['Ternary Sprint', 'level.ternarySprint'],
  ['Triple Power', 'level.triplePower'],
  ['Two-Layer Cube', 'level.twoLayerCube'],
  ['Layer Tower', 'level.layerTower'],
  ['4x4 Square', 'level.square4x4'],
  ['Long Strip', 'level.longStrip'],
  ['T-Formation', 'level.tFormation'],
  ['Rectangle', 'level.rectangle'],
  ['Plus Sign', 'level.plusSign'],
  ['Staircase', 'level.staircase'],
  ['H-Shape', 'level.hShape'],
  ['Tetris Master', 'level.tetrisMaster'],
  ['Big Rectangle', 'level.bigRectangle'],
  ['Long Board', 'level.longBoard'],
  ['Ultimate', 'level.ultimate'],
  ['Pentomino Rectangle', 'level.pentominoRectangle'],
  ['Wide Grid', 'level.wideGrid'],
])

function normalizedKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function formatDifficulty(locale: Locale, difficulty: string) {
  return tx(locale, `diff.${difficulty}`, difficulty)
}

export function formatGameTitle(locale: Locale, gameId: GameId | string) {
  return gameId in gameTitleKeys
    ? t(locale, gameTitleKeys[gameId as GameId])
    : gameId
}

export function formatGameDescription(locale: Locale, gameId: GameId | string) {
  return gameId in gameDescriptionKeys
    ? t(locale, gameDescriptionKeys[gameId as GameId])
    : ''
}

export function formatAchievementName(locale: Locale, achievementId: string) {
  return tx(locale, `achievement.${achievementId}.name`, achievementId)
}

export function formatAchievementDescription(
  locale: Locale,
  achievementId: string,
) {
  return tx(locale, `achievement.${achievementId}.description`, '')
}

export function formatAchievementRarity(
  locale: Locale,
  rarity: AchievementRarity | string,
) {
  return tx(locale, `rarity.${rarity}`, rarity)
}

export function formatRankName(locale: Locale, rankName: string) {
  return tx(locale, `rank.${normalizedKey(rankName)}`, rankName)
}

export function formatActor(locale: Locale, actor: string) {
  return tx(locale, `actor.${actor}`, actor)
}

export function formatLevelName(locale: Locale, name: string): string {
  if (name.startsWith('Practice: ')) {
    return `${t(locale, 'level.practicePrefix')}: ${formatLevelName(
      locale,
      name.slice('Practice: '.length),
    )}`
  }

  if (name.startsWith('Workshop: ')) {
    return `${t(locale, 'level.workshopPrefix')}: ${formatLevelName(
      locale,
      name.slice('Workshop: '.length),
    )}`
  }

  if (name.startsWith('Daily Challenge (') && name.endsWith(')')) {
    const inner = name.slice('Daily Challenge ('.length, -1)
    return `${t(locale, 'level.dailyChallenge')} (${formatLevelName(
      locale,
      inner,
    )})`
  }

  const constructive = name.match(
    /^Constructive (easy|medium|hard) \((\d+) pieces\)$/,
  )
  if (constructive?.[1] && constructive[2]) {
    return `${t(locale, 'level.constructive')} ${formatDifficulty(
      locale,
      constructive[1],
    ).toLowerCase()} (${constructive[2]} ${t(locale, 'stats.pieces')})`
  }

  const generatedSequence = name.match(/^(.+) \((\d+)\)$/)
  if (generatedSequence?.[1] && generatedSequence[2]) {
    return `${formatLevelName(locale, generatedSequence[1])} (${
      generatedSequence[2]
    })`
  }

  const key = levelNameKeys.get(name)
  return key ? t(locale, key) : name
}

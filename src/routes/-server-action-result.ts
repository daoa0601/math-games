interface ServerActionSuccess<T> {
  readonly ok: true
  readonly value: T
}

interface ServerActionFailure {
  readonly ok: false
  readonly message: string
}

export type ServerActionResult<T> = ServerActionSuccess<T> | ServerActionFailure

interface ProgressStatus {
  readonly attempts: number
  readonly bestScore: number
  readonly unlockedAchievements: readonly string[]
}

interface ProgressStatusLabels {
  readonly savedAttempt: string
  readonly bestScore: string
  readonly unlocked: string
  readonly solvedIn: string
}

const defaultProgressLabels: ProgressStatusLabels = {
  savedAttempt: 'Saved attempt',
  bestScore: 'best score',
  unlocked: 'Unlocked',
  solvedIn: 'Solved in',
}

function errorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage
}

function unlockedMessage(
  unlockedAchievements: readonly string[],
  labels: ProgressStatusLabels,
  formatAchievement: (id: string) => string,
) {
  return unlockedAchievements.length > 0
    ? ` ${labels.unlocked} ${unlockedAchievements.map(formatAchievement).join(', ')}.`
    : ''
}

export async function runServerAction<T>(
  action: () => Promise<T>,
  fallbackMessage: string,
): Promise<ServerActionResult<T>> {
  try {
    return {
      ok: true,
      value: await action(),
    }
  } catch (error) {
    return {
      ok: false,
      message: errorMessage(error, fallbackMessage),
    }
  }
}

export function formatSavedProgress(
  progress: ProgressStatus,
  labels = defaultProgressLabels,
  formatAchievement: (id: string) => string = (id) => id,
) {
  return `${labels.savedAttempt} ${progress.attempts}; ${labels.bestScore} ${
    progress.bestScore
  }.${unlockedMessage(progress.unlockedAchievements, labels, formatAchievement)}`
}

export function formatSolvedProgress(
  timeMs: number,
  progress: ProgressStatus,
  labels = defaultProgressLabels,
  formatAchievement: (id: string) => string = (id) => id,
) {
  return `${labels.solvedIn} ${timeMs.toFixed(1)}ms; ${labels.savedAttempt} ${
    progress.attempts
  }; ${labels.bestScore} ${progress.bestScore}.${unlockedMessage(
    progress.unlockedAchievements,
    labels,
    formatAchievement,
  )}`
}

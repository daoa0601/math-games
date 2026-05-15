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
  readonly unlockedAchievements: readonly string[]
}

interface ProgressStatusLabels {
  readonly unlocked: string
}

const defaultProgressLabels: ProgressStatusLabels = {
  unlocked: 'Unlocked',
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
  return unlockedMessage(
    progress.unlockedAchievements,
    labels,
    formatAchievement,
  ).trim() || null
}

export function formatSolvedProgress(
  _timeMs: number,
  progress: ProgressStatus,
  labels = defaultProgressLabels,
  formatAchievement: (id: string) => string = (id) => id,
) {
  return unlockedMessage(
    progress.unlockedAchievements,
    labels,
    formatAchievement,
  ).trim() || null
}

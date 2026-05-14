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

function errorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage
}

function unlockedMessage(unlockedAchievements: readonly string[]) {
  return unlockedAchievements.length > 0
    ? ` Unlocked ${unlockedAchievements.join(', ')}.`
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

export function formatSavedProgress(progress: ProgressStatus) {
  return `Saved attempt ${progress.attempts}; best score ${
    progress.bestScore
  }.${unlockedMessage(progress.unlockedAchievements)}`
}

export function formatSolvedProgress(timeMs: number, progress: ProgressStatus) {
  return `Solved in ${timeMs.toFixed(1)}ms; saved attempt ${
    progress.attempts
  }; best score ${progress.bestScore}.${unlockedMessage(
    progress.unlockedAchievements,
  )}`
}

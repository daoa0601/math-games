import { Data } from 'effect'

export class ProgressWriteError extends Data.TaggedError('ProgressWriteError')<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Unable to record game progress'
  }
}

export class GameProgressValidationError extends Data.TaggedError(
  'GameProgressValidationError',
)<{
  readonly reason: string
}> {
  override get message() {
    return this.reason
  }
}

export class DailyChallengeError extends Data.TaggedError(
  'DailyChallengeError',
)<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Unable to load daily challenge'
  }
}

export class PlayerProfileError extends Data.TaggedError('PlayerProfileError')<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Unable to load player profile'
  }
}

export class PlayerProfileWriteError extends Data.TaggedError(
  'PlayerProfileWriteError',
)<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Unable to save player profile'
  }
}

export class RateLimitError extends Data.TaggedError('RateLimitError')<{
  readonly key: string
}> {
  override get message() {
    return 'Too many requests'
  }
}

export class CrossOriginError extends Data.TaggedError('CrossOriginError')<{
  readonly reason: string
}> {
  override get message() {
    return this.reason
  }
}

export class PlayerProfileValidationError extends Data.TaggedError(
  'PlayerProfileValidationError',
)<{
  readonly reason: string
}> {
  override get message() {
    return this.reason
  }
}

export class ClassroomError extends Data.TaggedError('ClassroomError')<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Classroom operation failed'
  }
}

export class AuthorizationError extends Data.TaggedError('AuthorizationError')<{
  readonly reason: string
}> {
  override get message() {
    return this.reason
  }
}

export class GameAttemptsError extends Data.TaggedError('GameAttemptsError')<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Unable to record game attempt'
  }
}

export class DailyStreakError extends Data.TaggedError('DailyStreakError')<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Unable to record daily streak'
  }
}

export class SolverTimeoutError extends Data.TaggedError('SolverTimeoutError')<{
  readonly searchedStates: number
  readonly timeMs: number
}> {
  override get message() {
    return `Solver timed out after ${this.timeMs}ms (${this.searchedStates} states searched)`
  }
}

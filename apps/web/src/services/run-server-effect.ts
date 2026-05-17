import { Effect, ManagedRuntime, Match } from 'effect'

import type {
  ClockShape,
  HeaderShape,
  KvCacheShape,
  OriginGuardShape,
  RandomShape,
  RateLimitShape,
  TurnstileShape,
  WorkerEnvShape,
} from '@math-games/effect-infra'
import type {
  AnalyticsShape,
  DbShape,
  DailyStreakShape,
  GameAttemptsShape,
  LeaderboardShape,
  PlayerIdentityShape,
  RankShape,
} from '@math-games/effect-game'
import type {
  AccountLinkShape,
  AnalyticsDashboardShape,
  AssignmentShape,
  ClassroomShape,
} from '@math-games/effect-classroom'
import type {
  AuthorizationError,
  ClassroomError,
  CrossOriginError,
  DailyChallengeError,
  DailyStreakError,
  GameAttemptsError,
  GameProgressValidationError,
  PlayerProfileError,
  PlayerProfileValidationError,
  PlayerProfileWriteError,
  ProgressWriteError,
  RateLimitError,
  TurnstileError,
} from '@math-games/effect-infra'

import { AppLayer } from './app-layer'

export type AppServices =
  | AccountLinkShape
  | AnalyticsDashboardShape
  | AnalyticsShape
  | AssignmentShape
  | ClassroomShape
  | DailyStreakShape
  | GameAttemptsShape
  | LeaderboardShape
  | DbShape
  | OriginGuardShape
  | PlayerIdentityShape
  | RankShape
  | RateLimitShape
  | KvCacheShape
  | TurnstileShape
  | ClockShape
  | RandomShape
  | HeaderShape
  | WorkerEnvShape

export type ServerError =
  | RateLimitError
  | CrossOriginError
  | GameProgressValidationError
  | PlayerProfileValidationError
  | ProgressWriteError
  | DailyChallengeError
  | DailyStreakError
  | GameAttemptsError
  | ClassroomError
  | AuthorizationError
  | PlayerProfileError
  | PlayerProfileWriteError
  | TurnstileError

export const toUserFacingError = Match.type<ServerError>().pipe(
  Match.tag(
    'RateLimitError',
    () => new Error('Too many requests. Please wait a moment.'),
  ),
  Match.tag('CrossOriginError', () => new Error('Request blocked.')),
  Match.tag('GameProgressValidationError', (e) => new Error(e.reason)),
  Match.tag('PlayerProfileValidationError', (e) => new Error(e.reason)),
  Match.tag(
    'ProgressWriteError',
    () => new Error('Unable to save game progress.'),
  ),
  Match.tag(
    'DailyChallengeError',
    () => new Error("Unable to load today's challenge."),
  ),
  Match.tag(
    'DailyStreakError',
    () => new Error('Unable to record daily streak.'),
  ),
  Match.tag(
    'GameAttemptsError',
    () => new Error('Unable to record game attempt.'),
  ),
  Match.tag('ClassroomError', () => new Error('Classroom operation failed.')),
  Match.tag('AuthorizationError', (e) => new Error(e.reason)),
  Match.tag(
    'PlayerProfileError',
    () => new Error('Unable to load your profile.'),
  ),
  Match.tag(
    'PlayerProfileWriteError',
    () => new Error('Unable to save your profile.'),
  ),
  Match.tag('TurnstileError', (e) => new Error(e.reason)),
  Match.exhaustive,
)

let runtime: ManagedRuntime.ManagedRuntime<AppServices, never> | null = null

function getRuntime() {
  return (runtime ??= ManagedRuntime.make(AppLayer))
}

export function runServerEffect<TResult, TError extends ServerError>(
  effect: Effect.Effect<TResult, TError, AppServices>,
): Promise<TResult> {
  return getRuntime().runPromise(
    effect.pipe(
      Effect.tapError((e) => Effect.log(`Server error [${e._tag}]`)),
      Effect.mapError(toUserFacingError),
    ),
  )
}

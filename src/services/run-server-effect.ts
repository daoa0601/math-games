import { Effect, ManagedRuntime, Match } from 'effect'

import { AppLayer } from './app-layer'
import type { AnalyticsShape } from './analytics'
import type { ClockShape } from './clock'
import type { DbShape } from './db'
import type {
  CrossOriginError,
  DailyChallengeError,
  GameProgressValidationError,
  PlayerProfileError,
  PlayerProfileValidationError,
  PlayerProfileWriteError,
  ProgressWriteError,
  RateLimitError,
} from './errors'
import type { HeaderShape } from './headers'
import type { KvCacheShape } from './kv-cache'
import type { OriginGuardShape } from './origin-guard'
import type { PlayerIdentityShape } from './player-identity'
import type { RandomShape } from './random'
import type { RateLimitShape } from './rate-limit'
import type { TurnstileError, TurnstileShape } from './turnstile'
import type { WorkerEnvShape } from './worker-env'

export type AppServices =
  | AnalyticsShape
  | DbShape
  | OriginGuardShape
  | PlayerIdentityShape
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

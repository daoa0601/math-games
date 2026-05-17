import { Effect, Schedule } from "effect";

export const d1RetryPolicy = Schedule.exponential("50 millis").pipe(
  Schedule.both(Schedule.recurs(3)),
  Schedule.jittered,
);

export function withD1Retry<TResult, TError, TRequirements>(
  effect: Effect.Effect<TResult, TError, TRequirements>,
): Effect.Effect<TResult, TError, TRequirements> {
  return Effect.retry(effect, d1RetryPolicy);
}

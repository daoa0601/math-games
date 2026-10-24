import { Effect, Schedule } from "effect";

export const d1RetryPolicy = Schedule.exponential("50 millis").pipe(
  Schedule.upTo({ times: 3 }),
  Schedule.jittered,
);

export function withD1Retry<TResult, TError, TRequirements>(
  effect: Effect.Effect<TResult, TError, TRequirements>,
): Effect.Effect<TResult, TError, TRequirements> {
  return Effect.retry(effect, d1RetryPolicy);
}

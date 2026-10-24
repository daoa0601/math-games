import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import {
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
  SolverTimeoutError,
} from "../errors";

describe("domain errors", () => {
  it.each([
    [
      new ProgressWriteError({ cause: "db" }),
      "ProgressWriteError",
      "Unable to record game progress",
    ],
    [
      new DailyChallengeError({ cause: "db" }),
      "DailyChallengeError",
      "Unable to load daily challenge",
    ],
    [
      new PlayerProfileError({ cause: "db" }),
      "PlayerProfileError",
      "Unable to load player profile",
    ],
    [
      new PlayerProfileWriteError({ cause: "db" }),
      "PlayerProfileWriteError",
      "Unable to save player profile",
    ],
    [
      new RateLimitError({ key: "ip:1" }),
      "RateLimitError",
      "Too many requests",
    ],
    [
      new ClassroomError({ cause: "db" }),
      "ClassroomError",
      "Classroom operation failed",
    ],
    [
      new GameAttemptsError({ cause: "db" }),
      "GameAttemptsError",
      "Unable to record game attempt",
    ],
    [
      new DailyStreakError({ cause: "db" }),
      "DailyStreakError",
      "Unable to record daily streak",
    ],
    [
      new GameProgressValidationError({ reason: "bad level" }),
      "GameProgressValidationError",
      "bad level",
    ],
    [
      new CrossOriginError({ reason: "cross-site" }),
      "CrossOriginError",
      "cross-site",
    ],
    [
      new PlayerProfileValidationError({ reason: "bad name" }),
      "PlayerProfileValidationError",
      "bad name",
    ],
    [
      new AuthorizationError({ reason: "not a teacher" }),
      "AuthorizationError",
      "not a teacher",
    ],
    [
      new SolverTimeoutError({ searchedStates: 1200, timeMs: 50 }),
      "SolverTimeoutError",
      "Solver timed out after 50ms (1200 states searched)",
    ],
  ])("%o has tag %s and a user-facing message", (error, tag, message) => {
    expect(error._tag).toBe(tag);
    expect(error.message).toBe(message);
  });

  it("can be caught by tag in an Effect pipeline", async () => {
    const recovered = await Effect.runPromise(
      Effect.fail(new RateLimitError({ key: "ip:1" })).pipe(
        Effect.catchTag("RateLimitError", (error) => Effect.succeed(error.key)),
      ),
    );
    expect(recovered).toBe("ip:1");
  });
});

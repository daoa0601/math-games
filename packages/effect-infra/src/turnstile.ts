import { Context, Data, Effect, Layer } from "effect";

import { WorkerEnvService } from "./worker-env";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function isTurnstileResponse(body: unknown): body is { success: boolean } {
  return (
    body !== null &&
    typeof body === "object" &&
    "success" in body &&
    typeof (body as { success: unknown }).success === "boolean"
  );
}

export class TurnstileError extends Data.TaggedError("TurnstileError")<{
  readonly reason: string;
}> {
  override get message() {
    return this.reason;
  }
}

export interface TurnstileShape {
  readonly verify: (token: string) => Effect.Effect<void, TurnstileError>;
}

export const TurnstileService =
  Context.Service<TurnstileShape>("TurnstileService");

export const TurnstileServiceLive = Layer.effect(
  TurnstileService,
  Effect.map(WorkerEnvService, (env) => ({
    verify: (token: string): Effect.Effect<void, TurnstileError> =>
      Effect.gen(function* () {
        const secretKey = env.getTurnstileSecret();
        if (!secretKey) return;

        const response = yield* Effect.tryPromise({
          try: async () => {
            const r = await fetch(TURNSTILE_VERIFY_URL, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                secret: secretKey,
                response: token,
              }),
            });
            const body: unknown = await r.json();
            if (!isTurnstileResponse(body)) {
              throw new Error("Unexpected Turnstile response shape");
            }
            return body;
          },
          catch: () =>
            new TurnstileError({ reason: "Turnstile verification failed" }),
        });

        if (!response.success) {
          return yield* new TurnstileError({
            reason: "Bot verification failed",
          });
        }
      }),
  })),
);

import { Context, Data, Effect, Layer } from 'effect'

import { WorkerEnvService } from './worker-env'

export class TurnstileError extends Data.TaggedError('TurnstileError')<{
  readonly reason: string
}> {
  override get message() {
    return this.reason
  }
}

export interface TurnstileShape {
  readonly verify: (token: string) => Effect.Effect<void, TurnstileError>
}

export const TurnstileService =
  Context.Service<TurnstileShape>('TurnstileService')

export const TurnstileServiceLive = Layer.effect(
  TurnstileService,
  Effect.map(WorkerEnvService, (env) => ({
    verify: (token: string): Effect.Effect<void, TurnstileError> =>
      Effect.gen(function* () {
        const secretKey = env.getTurnstileSecret()
        if (!secretKey) return

        const response = yield* Effect.tryPromise({
          try: async (): Promise<{ success: boolean }> => {
            const r = await fetch(
              'https://challenges.cloudflare.com/turnstile/v0/siteverify',
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  secret: secretKey,
                  response: token,
                }),
              },
            )
            return r.json()
          },
          catch: () =>
            new TurnstileError({ reason: 'Turnstile verification failed' }),
        })

        if (!response.success) {
          return yield* new TurnstileError({
            reason: 'Bot verification failed',
          })
        }
      }),
  })),
)

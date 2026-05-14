import { Context, Effect, Layer } from 'effect'

export interface RandomShape {
  readonly uuid: () => Effect.Effect<string>
}

export const RandomService = Context.Service<RandomShape>('RandomService')

export const RandomServiceLive = Layer.succeed(RandomService, {
  uuid: () => Effect.sync(() => crypto.randomUUID()),
})

import { Context, Effect, Layer } from 'effect'

export interface ClockShape {
  readonly now: () => Effect.Effect<Date>
  readonly dateKey: () => Effect.Effect<string>
}

export const ClockService = Context.Service<ClockShape>('ClockService')

export const ClockServiceLive = Layer.succeed(ClockService, {
  now: () => Effect.sync(() => new Date()),
  dateKey: () =>
    Effect.sync(() => new Date().toISOString().slice(0, 10)),
})

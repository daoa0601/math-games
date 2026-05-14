import {
  getRequestHeader,
  setResponseHeader,
} from '@tanstack/react-start/server'
import { Context, Effect, Layer } from 'effect'

export interface HeaderShape {
  readonly getRequest: (name: string) => Effect.Effect<string | null>
  readonly setResponse: (name: string, value: string) => Effect.Effect<void>
}

export const HeaderService = Context.Service<HeaderShape>('HeaderService')

export const HeaderServiceLive = Layer.succeed(HeaderService, {
  getRequest: (name) =>
    Effect.sync(() => getRequestHeader(name) ?? null),
  setResponse: (name, value) =>
    Effect.sync(() => setResponseHeader(name, value)),
})

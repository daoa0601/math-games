import {
  getRequest,
  getRequestHeader,
  setResponseHeader,
} from "@tanstack/react-start/server";
import { Context, Effect, Layer } from "effect";

export interface HeaderShape {
  readonly getRequest: (name: string) => Effect.Effect<string | null>;
  readonly setResponse: (name: string, value: string) => Effect.Effect<void>;
  /** The in-flight request, stable across every server fn it runs (SSR loaders share it). */
  readonly currentRequest: () => Effect.Effect<object>;
}

export const HeaderService = Context.Service<HeaderShape>("HeaderService");

export const HeaderServiceLive = Layer.succeed(HeaderService, {
  getRequest: (name) => Effect.sync(() => getRequestHeader(name) ?? null),
  setResponse: (name, value) =>
    Effect.sync(() => setResponseHeader(name, value)),
  currentRequest: () => Effect.sync(() => getRequest()),
});

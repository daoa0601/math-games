import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { HeaderService, RandomService } from "@math-games/effect-infra";

import {
  PlayerIdentityService,
  PlayerIdentityServiceLive,
} from "../player-identity";
import { playerCookieName } from "../identity.server";

const FIXED_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_PLAYER_ID = `player_${FIXED_UUID}`;

function buildLayer(headers: Record<string, string>) {
  const setCookies: Array<{ name: string; value: string }> = [];

  const headerLayer = Layer.succeed(HeaderService, {
    getRequest: (name: string) => Effect.succeed(headers[name] ?? null),
    setResponse: (name: string, value: string) => {
      setCookies.push({ name, value });
      return Effect.void;
    },
  });

  const randomLayer = Layer.succeed(RandomService, {
    uuid: () => Effect.succeed(FIXED_UUID),
  });

  const layer = PlayerIdentityServiceLive.pipe(
    Layer.provide(Layer.mergeAll(headerLayer, randomLayer)),
  );

  return { layer, setCookies };
}

describe("PlayerIdentityService", () => {
  it("resolves an existing player from the cookie", async () => {
    const { layer } = buildLayer({
      cookie: `${playerCookieName}=${VALID_PLAYER_ID}`,
    });

    const identity = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* PlayerIdentityService;
        return yield* service.resolve();
      }).pipe(Effect.provide(layer)),
    );

    expect(identity.id).toBe(VALID_PLAYER_ID);
  });

  it("creates a new player when no cookie is present", async () => {
    const { layer, setCookies } = buildLayer({
      host: "math-games.example.com",
    });

    const identity = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* PlayerIdentityService;
        return yield* service.resolve();
      }).pipe(Effect.provide(layer)),
    );

    expect(identity.id).toBe(VALID_PLAYER_ID);
    expect(setCookies.length).toBe(1);
    expect(setCookies[0].name).toBe("set-cookie");
    expect(setCookies[0].value).toContain(VALID_PLAYER_ID);
  });

  it("creates a new player when the cookie value is malformed", async () => {
    const { layer, setCookies } = buildLayer({
      cookie: `${playerCookieName}=garbage`,
      host: "math-games.example.com",
    });

    const identity = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* PlayerIdentityService;
        return yield* service.resolve();
      }).pipe(Effect.provide(layer)),
    );

    expect(identity.id).toBe(VALID_PLAYER_ID);
    expect(setCookies.length).toBe(1);
  });

  it("resolveId returns just the id string", async () => {
    const { layer } = buildLayer({
      cookie: `${playerCookieName}=${VALID_PLAYER_ID}`,
    });

    const id = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* PlayerIdentityService;
        return yield* service.resolveId();
      }).pipe(Effect.provide(layer)),
    );

    expect(id).toBe(VALID_PLAYER_ID);
  });

  it("set-cookie includes Secure for production hosts", async () => {
    const { layer, setCookies } = buildLayer({
      host: "math-games.workers.dev",
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* PlayerIdentityService;
        return yield* service.resolve();
      }).pipe(Effect.provide(layer)),
    );

    expect(setCookies[0].value).toContain("Secure");
  });

  it("set-cookie omits Secure for localhost", async () => {
    const { layer, setCookies } = buildLayer({
      host: "localhost:3000",
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* PlayerIdentityService;
        return yield* service.resolve();
      }).pipe(Effect.provide(layer)),
    );

    expect(setCookies[0].value).not.toContain("Secure");
  });
});

import { Context, Effect, Layer } from "effect";

import {
  createPlayerIdentity,
  createPlayerId,
  parsePlayerIdCookie,
  serializePlayerIdCookie,
} from "./identity.server";
import type { PlayerIdentity } from "./identity.server";

import { HeaderService, RandomService } from "@math-games/effect-infra";

export interface PlayerIdentityShape {
  readonly resolve: () => Effect.Effect<PlayerIdentity>;
  readonly resolveId: () => Effect.Effect<string>;
}

export const PlayerIdentityService = Context.Service<PlayerIdentityShape>(
  "PlayerIdentityService",
);

export const PlayerIdentityServiceLive = Layer.effect(
  PlayerIdentityService,
  Effect.gen(function* () {
    const headers = yield* HeaderService;
    const random = yield* RandomService;
    // A cookieless first visit runs several loaders in parallel (e.g. /daily's
    // challenge + profile). They must share one minted player, or rows get
    // written for one id while the browser keeps the cookie of another.
    const mintedByRequest = new WeakMap<object, PlayerIdentity>();

    const resolve = () =>
      Effect.gen(function* () {
        const cookieHeader = yield* headers.getRequest("cookie");
        const existingId = parsePlayerIdCookie(cookieHeader);

        if (existingId) return createPlayerIdentity(existingId);

        const request = yield* headers.currentRequest();
        const uuid = yield* random.uuid();
        // Lookup and insert in one synchronous step so concurrent fibers
        // cannot both miss.
        const minted = yield* Effect.sync(() => {
          const existing = mintedByRequest.get(request);
          if (existing) return { identity: existing, isNew: false };
          const identity = createPlayerIdentity(createPlayerId(() => uuid));
          mintedByRequest.set(request, identity);
          return { identity, isNew: true };
        });
        if (!minted.isNew) return minted.identity;

        const host = yield* headers.getRequest("host");
        yield* headers.setResponse(
          "set-cookie",
          serializePlayerIdCookie(minted.identity.id, host ?? undefined),
        );

        return minted.identity;
      });

    return {
      resolve,
      resolveId: () => Effect.map(resolve(), (identity) => identity.id),
    };
  }),
);

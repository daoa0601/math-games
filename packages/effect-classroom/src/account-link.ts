import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { schema } from "@math-games/db";

import { PlayerProfileError, withD1Retry } from "@math-games/effect-infra";
import { DbService } from "@math-games/effect-game";

export interface AccountLinkShape {
  readonly requestLink: (
    playerId: string,
    email: string,
  ) => Effect.Effect<{ token: string }, PlayerProfileError>;

  readonly verifyLink: (
    token: string,
  ) => Effect.Effect<{ playerId: string } | null, PlayerProfileError>;

  readonly resolveByEmail: (
    email: string,
  ) => Effect.Effect<string | null, PlayerProfileError>;
}

export const AccountLinkService =
  Context.Service<AccountLinkShape>("AccountLinkService");

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const TOKEN_TTL_SECONDS = 3600;

export const AccountLinkServiceLive = Layer.effect(
  AccountLinkService,
  Effect.map(DbService, ({ db }) => ({
    requestLink: (playerId, email) =>
      Effect.gen(function* () {
        const token = generateToken();
        const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

        yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db
                .insert(schema.accountLinks)
                .values({
                  playerId,
                  email,
                  magicLinkToken: token,
                  tokenExpiresAt: expiresAt,
                })
                .onConflictDoUpdate({
                  target: schema.accountLinks.playerId,
                  set: {
                    email,
                    magicLinkToken: token,
                    tokenExpiresAt: expiresAt,
                  },
                }),
            catch: (cause) => new PlayerProfileError({ cause }),
          }),
        );

        return { token };
      }),

    verifyLink: (token) =>
      Effect.gen(function* () {
        const rows = yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db
                .select({
                  playerId: schema.accountLinks.playerId,
                  tokenExpiresAt: schema.accountLinks.tokenExpiresAt,
                })
                .from(schema.accountLinks)
                .where(eq(schema.accountLinks.magicLinkToken, token))
                .limit(1),
            catch: (cause) => new PlayerProfileError({ cause }),
          }),
        );

        if (rows.length === 0) return null;

        const row = rows[0];
        if (row.tokenExpiresAt && row.tokenExpiresAt < new Date()) return null;

        yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db
                .update(schema.accountLinks)
                .set({ magicLinkToken: null, tokenExpiresAt: null })
                .where(eq(schema.accountLinks.playerId, row.playerId)),
            catch: (cause) => new PlayerProfileError({ cause }),
          }),
        );

        return { playerId: row.playerId };
      }),

    resolveByEmail: (email) =>
      Effect.gen(function* () {
        const rows = yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db
                .select({ playerId: schema.accountLinks.playerId })
                .from(schema.accountLinks)
                .where(eq(schema.accountLinks.email, email))
                .limit(1),
            catch: (cause) => new PlayerProfileError({ cause }),
          }),
        );

        return rows.length > 0 ? rows[0].playerId : null;
      }),
  })),
);

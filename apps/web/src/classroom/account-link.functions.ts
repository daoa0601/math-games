import { createServerFn } from '@tanstack/react-start'
import { Effect, Schema } from 'effect'

import {
  AccountLinkService,
  OriginGuardService,
  PlayerIdentityService,
  RateLimitService,
  runServerEffect,
} from '@math-games/services'

const RequestLinkInput = Schema.Struct({
  email: Schema.NonEmptyString,
})

const VerifyLinkInput = Schema.Struct({
  token: Schema.NonEmptyString,
})

export const requestAccountLink = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(RequestLinkInput))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        yield* (yield* OriginGuardService).assert()
        const playerId = yield* (yield* PlayerIdentityService).resolveId()
        yield* (yield* RateLimitService).assert(`account-link:${playerId}`)

        const accountLink = yield* AccountLinkService
        const { token } = yield* accountLink.requestLink(playerId, data.email)

        return { sent: true, token }
      }),
    ),
  )

export const verifyAccountLink = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(VerifyLinkInput))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        yield* (yield* OriginGuardService).assert()

        const accountLink = yield* AccountLinkService
        const result = yield* accountLink.verifyLink(data.token)

        if (!result) {
          return { verified: false, playerId: null }
        }

        return { verified: true, playerId: result.playerId }
      }),
    ),
  )

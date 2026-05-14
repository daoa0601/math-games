import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  createPlayerId,
  createPlayerIdentity,
  defaultPlayerIdentity,
  localPlayerId,
  parsePlayerIdCookie,
  playerCookieName,
  serializePlayerIdCookie,
} from '../identity.server'
import {
  HeaderService,
  PlayerIdentityService,
  PlayerIdentityServiceLive,
  RandomService,
} from '@/services'

describe('player identity boundary', () => {
  const uuid = '123e4567-e89b-42d3-a456-426614174000'
  const playerId = `player_${uuid}`

  it('keeps the development fallback in one server boundary', () => {
    expect(localPlayerId).toBe('local-player')
    expect(defaultPlayerIdentity).toEqual({
      id: localPlayerId,
      displayName: 'Guest Player',
      locale: 'en',
      gradeBand: 'elementary',
    })
  })

  it('creates Cloudflare-compatible player ids', () => {
    expect(createPlayerId(() => uuid)).toBe(playerId)
  })

  it('derives stable guest profile defaults from generated player ids', () => {
    expect(createPlayerIdentity(playerId)).toEqual({
      ...defaultPlayerIdentity,
      id: playerId,
      displayName: 'Guest 123e4567',
    })
  })

  it('reads the player cookie from request headers', () => {
    expect(
      parsePlayerIdCookie(`theme=light; ${playerCookieName}=${playerId}`),
    ).toBe(playerId)
    expect(parsePlayerIdCookie(`${playerCookieName}=local-player`)).toBe(null)
  })

  it('serializes an http-only player cookie', () => {
    expect(serializePlayerIdCookie(playerId)).toBe(
      `${playerCookieName}=${playerId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`,
    )
  })

  function runPlayerIdentityService(headers: Record<string, string | null>) {
    const responseHeaders: Record<string, string> = {}
    const headerLayer = Layer.succeed(HeaderService, {
      getRequest: (name) => Effect.succeed(headers[name] ?? null),
      setResponse: (name, value) =>
        Effect.sync(() => {
          responseHeaders[name] = value
        }),
    })
    const randomLayer = Layer.succeed(RandomService, {
      uuid: () => Effect.succeed(uuid),
    })
    const serviceLayer = PlayerIdentityServiceLive.pipe(
      Layer.provide(Layer.merge(headerLayer, randomLayer)),
    )

    return Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* PlayerIdentityService
        const identity = yield* service.resolve()

        return { identity, responseHeaders }
      }).pipe(Effect.provide(serviceLayer)),
    )
  }

  it('uses the request cookie identity when present', async () => {
    const { identity, responseHeaders } = await runPlayerIdentityService({
      cookie: `${playerCookieName}=${playerId}`,
    })

    expect(identity).toEqual({
      ...defaultPlayerIdentity,
      id: playerId,
      displayName: 'Guest 123e4567',
    })
    expect(responseHeaders).toEqual({})
  })

  it('creates and persists a player cookie when missing', async () => {
    const { identity, responseHeaders } = await runPlayerIdentityService({
      cookie: null,
      host: null,
    })

    expect(identity.id).toBe(playerId)
    expect(identity.displayName).toBe('Guest 123e4567')
    expect(responseHeaders).toEqual({
      'set-cookie': serializePlayerIdCookie(playerId),
    })
  })
})

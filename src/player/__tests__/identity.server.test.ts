import { describe, expect, it } from 'vitest'

import {
  createPlayerId,
  createPlayerIdentity,
  defaultPlayerIdentity,
  getCurrentPlayerId,
  getCurrentPlayerIdentity,
  localPlayerId,
  parsePlayerIdCookie,
  playerCookieName,
  serializePlayerIdCookie,
} from '../identity.server'

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

  it('uses the request cookie identity when present', () => {
    const identity = getCurrentPlayerIdentity({
      cookieHeader: `${playerCookieName}=${playerId}`,
    })

    expect(identity).toEqual({
      ...defaultPlayerIdentity,
      id: playerId,
      displayName: 'Guest 123e4567',
    })
    expect(
      getCurrentPlayerId({ cookieHeader: `${playerCookieName}=${playerId}` }),
    ).toBe(playerId)
  })

  it('creates and persists a player cookie when missing', () => {
    const persistedCookies: string[] = []
    const identity = getCurrentPlayerIdentity({
      cookieHeader: null,
      createUuid: () => uuid,
      persistCookie: (cookie) => persistedCookies.push(cookie),
    })

    expect(identity.id).toBe(playerId)
    expect(identity.displayName).toBe('Guest 123e4567')
    expect(persistedCookies).toEqual([serializePlayerIdCookie(playerId)])
  })
})

import {
  getRequestHeader,
  setResponseHeader,
} from '@tanstack/react-start/server'

export const playerCookieName = 'mg_player'
export const playerCookieMaxAge = 60 * 60 * 24 * 365
export const localPlayerId = 'local-player'

export interface PlayerIdentity {
  id: string
  displayName: string
  locale: 'en' | 'vi'
  gradeBand: 'elementary' | 'middle' | 'high'
}

export const defaultPlayerIdentity: PlayerIdentity = {
  id: localPlayerId,
  displayName: 'Guest Player',
  locale: 'en',
  gradeBand: 'elementary',
}

export interface ResolvePlayerIdentityOptions {
  cookieHeader?: string | null
  host?: string | null
  createUuid?: () => string
  persistCookie?: (cookie: string) => void
}

const playerIdPattern =
  /^player_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function createPlayerId(
  createUuid: () => string = () => crypto.randomUUID(),
) {
  return `player_${createUuid()}`
}

export function createGuestDisplayName(playerId: string) {
  return playerId === localPlayerId
    ? defaultPlayerIdentity.displayName
    : `Guest ${playerId.slice('player_'.length, 'player_'.length + 8)}`
}

export function createPlayerIdentity(playerId: string): PlayerIdentity {
  return {
    ...defaultPlayerIdentity,
    id: playerId,
    displayName: createGuestDisplayName(playerId),
  }
}

export function parsePlayerIdCookie(cookieHeader: string | null | undefined) {
  if (cookieHeader === null || cookieHeader === undefined) return null

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${playerCookieName}=`))

  const value = cookie?.slice(playerCookieName.length + 1)

  return value !== undefined && playerIdPattern.test(value) ? value : null
}

function isHttpsRequest(host: string | null | undefined): boolean {
  // Cookies marked Secure would be dropped over http://localhost in dev.
  // CF Workers in production serve over HTTPS with a workers.dev or custom
  // domain Host. Use a hostname check rather than X-Forwarded-Proto since
  // CF doesn't always populate it on the platform's own ingress.
  if (host === null || host === undefined) return false

  const hostname = host.split(':')[0]

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')
  ) {
    return false
  }

  return true
}

export function serializePlayerIdCookie(playerId: string, host?: string) {
  const secure = isHttpsRequest(host) ? '; Secure' : ''

  return `${playerCookieName}=${playerId}; Path=/; Max-Age=${playerCookieMaxAge}; HttpOnly; SameSite=Lax${secure}`
}

function readRequestCookieHeader(options: ResolvePlayerIdentityOptions) {
  return 'cookieHeader' in options
    ? options.cookieHeader
    : getRequestHeader('cookie')
}

function readRequestHostHeader(options: ResolvePlayerIdentityOptions) {
  if ('host' in options) return options.host

  // Only consult request context when we're not in explicit-injection (test)
  // mode. Tests pass cookieHeader without host; reading getRequestHeader there
  // would throw because there's no request context.
  if ('cookieHeader' in options) return null

  return getRequestHeader('host')
}

function writePlayerCookie(
  cookie: string,
  options: ResolvePlayerIdentityOptions,
) {
  const persistCookie =
    options.persistCookie ??
    ((value: string) => setResponseHeader('set-cookie', value))

  persistCookie(cookie)
}

export function getCurrentPlayerIdentity(
  options: ResolvePlayerIdentityOptions = {},
): PlayerIdentity {
  const cookiePlayerId = parsePlayerIdCookie(readRequestCookieHeader(options))

  if (cookiePlayerId !== null) {
    return createPlayerIdentity(cookiePlayerId)
  }

  const playerId = createPlayerId(options.createUuid)
  const host = readRequestHostHeader(options)

  writePlayerCookie(
    serializePlayerIdCookie(playerId, host ?? undefined),
    options,
  )

  return createPlayerIdentity(playerId)
}

export function getCurrentPlayerId(options: ResolvePlayerIdentityOptions = {}) {
  return getCurrentPlayerIdentity(options).id
}

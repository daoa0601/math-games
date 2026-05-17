export const playerCookieName = "mg_player";
export const playerCookieMaxAge = 60 * 60 * 24 * 365;
export const localPlayerId = "local-player";

export interface PlayerIdentity {
  id: string;
  displayName: string;
  locale: "en" | "vi";
  gradeBand: "elementary" | "middle" | "high";
}

export const defaultPlayerIdentity: PlayerIdentity = {
  id: localPlayerId,
  displayName: "Guest Player",
  locale: "en",
  gradeBand: "elementary",
};

const playerIdPattern =
  /^player_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createPlayerId(
  createUuid: () => string = () => crypto.randomUUID(),
) {
  return `player_${createUuid()}`;
}

export function createGuestDisplayName(playerId: string) {
  return playerId === localPlayerId
    ? defaultPlayerIdentity.displayName
    : `Guest ${playerId.slice("player_".length, "player_".length + 8)}`;
}

export function createPlayerIdentity(playerId: string): PlayerIdentity {
  return {
    ...defaultPlayerIdentity,
    id: playerId,
    displayName: createGuestDisplayName(playerId),
  };
}

export function parsePlayerIdCookie(cookieHeader: string | null | undefined) {
  if (cookieHeader === null || cookieHeader === undefined) return null;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${playerCookieName}=`));

  const value = cookie?.slice(playerCookieName.length + 1);

  return value !== undefined && playerIdPattern.test(value) ? value : null;
}

function isHttpsRequest(host: string | null | undefined): boolean {
  // Cookies marked Secure would be dropped over http://localhost in dev.
  // CF Workers in production serve over HTTPS with a workers.dev or custom
  // domain Host. Use a hostname check rather than X-Forwarded-Proto since
  // CF doesn't always populate it on the platform's own ingress.
  if (host === null || host === undefined) return false;

  const hostname = host.split(":")[0];

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  ) {
    return false;
  }

  return true;
}

export function serializePlayerIdCookie(playerId: string, host?: string) {
  const secure = isHttpsRequest(host) ? "; Secure" : "";

  return `${playerCookieName}=${playerId}; Path=/; Max-Age=${playerCookieMaxAge}; HttpOnly; SameSite=Lax${secure}`;
}

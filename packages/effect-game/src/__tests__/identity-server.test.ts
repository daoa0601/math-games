import { describe, expect, it } from "vitest";

import {
  createPlayerId,
  createPlayerIdentity,
  defaultPlayerIdentity,
  localPlayerId,
  parsePlayerIdCookie,
  playerCookieMaxAge,
  playerCookieName,
  serializePlayerIdCookie,
} from "../identity.server";

describe("createPlayerId", () => {
  it("prefixes the UUID with player_", () => {
    const id = createPlayerId(() => "550e8400-e29b-41d4-a716-446655440000");
    expect(id).toBe("player_550e8400-e29b-41d4-a716-446655440000");
  });

  it("produces unique IDs on repeated calls", () => {
    let counter = 0;
    const makeUuid = () => {
      counter++;
      return `550e8400-e29b-41d4-a716-44665544000${counter}`;
    };
    const a = createPlayerId(makeUuid);
    const b = createPlayerId(makeUuid);
    expect(a).not.toBe(b);
  });
});

describe("createPlayerIdentity", () => {
  it("returns an identity with the given id and a generated display name", () => {
    const id = "player_550e8400-e29b-41d4-a716-446655440000";
    const identity = createPlayerIdentity(id);

    expect(identity.id).toBe(id);
    expect(identity.displayName).toBe("Guest 550e8400");
    expect(identity.locale).toBe("en");
    expect(identity.gradeBand).toBe("elementary");
  });

  it("uses the default display name for the local player id", () => {
    const identity = createPlayerIdentity(localPlayerId);

    expect(identity.id).toBe(localPlayerId);
    expect(identity.displayName).toBe(defaultPlayerIdentity.displayName);
  });
});

describe("parsePlayerIdCookie", () => {
  const validId = "player_550e8400-e29b-41d4-a716-446655440000";

  it("extracts a valid player id from a cookie header", () => {
    const header = `${playerCookieName}=${validId}`;
    expect(parsePlayerIdCookie(header)).toBe(validId);
  });

  it("extracts the id when other cookies are present", () => {
    const header = `other=abc; ${playerCookieName}=${validId}; theme=dark`;
    expect(parsePlayerIdCookie(header)).toBe(validId);
  });

  it("returns null for null input", () => {
    expect(parsePlayerIdCookie(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(parsePlayerIdCookie(undefined)).toBe(null);
  });

  it("returns null when the cookie is not present", () => {
    expect(parsePlayerIdCookie("other=abc; theme=dark")).toBe(null);
  });

  it("returns null for a malformed player id", () => {
    const header = `${playerCookieName}=not-a-valid-id`;
    expect(parsePlayerIdCookie(header)).toBe(null);
  });

  it("returns null for an empty cookie value", () => {
    const header = `${playerCookieName}=`;
    expect(parsePlayerIdCookie(header)).toBe(null);
  });

  it("accepts UUID variants 1-5", () => {
    const v1 = "player_550e8400-e29b-11d4-a716-446655440000";
    const v4 = "player_550e8400-e29b-41d4-a716-446655440000";
    const v5 = "player_550e8400-e29b-51d4-a716-446655440000";

    expect(parsePlayerIdCookie(`${playerCookieName}=${v1}`)).toBe(v1);
    expect(parsePlayerIdCookie(`${playerCookieName}=${v4}`)).toBe(v4);
    expect(parsePlayerIdCookie(`${playerCookieName}=${v5}`)).toBe(v5);
  });

  it("rejects a uuid without the player_ prefix", () => {
    const header = `${playerCookieName}=550e8400-e29b-41d4-a716-446655440000`;
    expect(parsePlayerIdCookie(header)).toBe(null);
  });
});

describe("serializePlayerIdCookie", () => {
  const playerId = "player_550e8400-e29b-41d4-a716-446655440000";

  it("includes HttpOnly and SameSite=Lax", () => {
    const cookie = serializePlayerIdCookie(playerId);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("sets the correct Max-Age", () => {
    const cookie = serializePlayerIdCookie(playerId);
    expect(cookie).toContain(`Max-Age=${playerCookieMaxAge}`);
  });

  it("sets Path=/", () => {
    const cookie = serializePlayerIdCookie(playerId);
    expect(cookie).toContain("Path=/");
  });

  it("omits Secure for localhost", () => {
    const cookie = serializePlayerIdCookie(playerId, "localhost");
    expect(cookie).not.toContain("Secure");
  });

  it("omits Secure for localhost with port", () => {
    const cookie = serializePlayerIdCookie(playerId, "localhost:3000");
    expect(cookie).not.toContain("Secure");
  });

  it("omits Secure for 127.0.0.1", () => {
    const cookie = serializePlayerIdCookie(playerId, "127.0.0.1");
    expect(cookie).not.toContain("Secure");
  });

  it("includes Secure for ::1 (IPv6 localhost is not special-cased after host split)", () => {
    // ::1 splits on ':' to hostname '', which is not matched by the localhost check
    const cookie = serializePlayerIdCookie(playerId, "::1");
    expect(cookie).toContain("Secure");
  });

  it("omits Secure for subdomains of localhost", () => {
    const cookie = serializePlayerIdCookie(playerId, "app.localhost");
    expect(cookie).not.toContain("Secure");
  });

  it("includes Secure for production hosts", () => {
    const cookie = serializePlayerIdCookie(playerId, "math-games.example.com");
    expect(cookie).toContain("Secure");
  });

  it("includes Secure for workers.dev hosts", () => {
    const cookie = serializePlayerIdCookie(playerId, "math.workers.dev");
    expect(cookie).toContain("Secure");
  });

  it("omits Secure when host is undefined", () => {
    const cookie = serializePlayerIdCookie(playerId, undefined);
    expect(cookie).not.toContain("Secure");
  });

  it("starts with the cookie name and value", () => {
    const cookie = serializePlayerIdCookie(playerId);
    expect(cookie.startsWith(`${playerCookieName}=${playerId}`)).toBe(true);
  });
});

describe("constants", () => {
  it("playerCookieName is mg_player", () => {
    expect(playerCookieName).toBe("mg_player");
  });

  it("playerCookieMaxAge is roughly one year in seconds", () => {
    const oneYearSeconds = 60 * 60 * 24 * 365;
    expect(playerCookieMaxAge).toBe(oneYearSeconds);
  });

  it("localPlayerId is the expected sentinel value", () => {
    expect(localPlayerId).toBe("local-player");
  });

  it("defaultPlayerIdentity has the correct shape", () => {
    expect(defaultPlayerIdentity.id).toBe(localPlayerId);
    expect(defaultPlayerIdentity.displayName).toBe("Guest Player");
    expect(defaultPlayerIdentity.locale).toBe("en");
    expect(defaultPlayerIdentity.gradeBand).toBe("elementary");
  });
});

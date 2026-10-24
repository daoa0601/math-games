import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { GameProgressRequest } from "../game-progress.schema";

const decode = Schema.decodeUnknownSync(GameProgressRequest);

describe("GameProgressRequest", () => {
  it("accepts a level id with a completion payload", () => {
    const request = decode({ levelId: "easy_1", completion: { moves: 3 } });
    expect(request.levelId).toBe("easy_1");
    expect(request.completion).toEqual({ moves: 3 });
  });

  it("accepts the optional daily date and turnstile token", () => {
    const request = decode({
      levelId: "easy_1",
      completion: [],
      challengeDate: "2026-10-24",
      turnstileToken: "token",
    });
    expect(request.challengeDate).toBe("2026-10-24");
  });

  it.each([
    { levelId: "", completion: {} },
    { levelId: "easy_1" },
    { levelId: "easy_1", completion: null },
  ])("rejects %o", (input) => {
    expect(() => decode(input)).toThrow();
  });
});

import { describe, expect, it } from "vitest";

import { computeRank, computeRankScore } from "../ranks";

describe("computeRank", () => {
  it.each([
    [0, "Explorer"],
    [3, "Explorer"],
    [4, "Builder"],
    [9, "Builder"],
    [10, "Strategist"],
    [20, "Scholar"],
    [34, "Scholar"],
    [35, "Grandmaster"],
    [1000, "Grandmaster"],
  ])("ranks a score of %i as %s", (score, name) => {
    expect(computeRank(score).name).toBe(name);
  });

  it("falls back to the first rank below every threshold", () => {
    expect(computeRank(-5).name).toBe("Explorer");
  });
});

describe("computeRankScore", () => {
  it("weights completed levels twice as much as achievements", () => {
    expect(computeRankScore(3, 4)).toBe(10);
    expect(computeRankScore(0, 0)).toBe(0);
  });
});

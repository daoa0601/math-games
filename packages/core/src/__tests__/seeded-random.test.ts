import { describe, expect, it } from "vitest";

import { createDailyRandom, createSeededRandom } from "../utils/seeded-random";

function draws(seed: string, count: number): number[] {
  const rng = createSeededRandom(seed);
  return Array.from({ length: count }, () => rng.next());
}

describe("createSeededRandom", () => {
  it("replays the same sequence for the same seed", () => {
    expect(draws("2025-01-01", 20)).toEqual(draws("2025-01-01", 20));
  });

  it("produces different sequences for different seeds", () => {
    expect(draws("2025-01-01", 20)).not.toEqual(draws("2025-01-02", 20));
  });

  it("keeps next() within [0, 1)", () => {
    for (const value of draws("range", 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("returns integers within the inclusive bounds and reaches both ends", () => {
    const rng = createSeededRandom("ints");
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const value = rng.nextInt(3, 6);
      expect(Number.isInteger(value)).toBe(true);
      seen.add(value);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it("picks elements from the array and rejects an empty one", () => {
    const rng = createSeededRandom("pick");
    const options = ["line", "cross", "triangle"] as const;
    for (let i = 0; i < 50; i++) {
      expect(options).toContain(rng.pick(options));
    }
    expect(() => rng.pick([])).toThrow("Cannot pick from empty array");
  });

  it("shuffles into a deterministic permutation without mutating the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const first = createSeededRandom("shuffle").shuffle(input);
    const second = createSeededRandom("shuffle").shuffle(input);

    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(first).toEqual(second);
    expect([...first].sort((a, b) => a - b)).toEqual(input);
  });

  it("exposes the seed it was created with", () => {
    expect(createSeededRandom("abc").seed).toBe("abc");
  });
});

describe("createDailyRandom", () => {
  it("gives each game its own sequence for the same date", () => {
    const magic = createDailyRandom("2025-01-01", "magic-graph");
    const race = createDailyRandom("2025-01-01", "sequence-race");

    expect(magic.seed).toBe("2025-01-01-magic-graph");
    expect(magic.next()).toBe(
      createSeededRandom("2025-01-01-magic-graph").next(),
    );
    expect(race.next()).not.toBe(
      createDailyRandom("2025-01-01", "magic-graph").next(),
    );
  });
});

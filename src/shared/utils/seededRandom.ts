/**
 * Seeded Pseudo-Random Number Generator
 *
 * Uses Mulberry32 algorithm - fast (~150M ops/sec) with excellent distribution.
 * Same seed always produces the same sequence of numbers, enabling reproducible
 * daily challenges where all players get the same puzzle on the same date.
 *
 * @example
 * const rng = createSeededRandom('2025-01-01');
 * rng.next();      // Always returns same value for this seed
 * rng.nextInt(1, 10);  // Random int between 1 and 10 inclusive
 * rng.pick(['a', 'b', 'c']);  // Random element from array
 * rng.shuffle([1, 2, 3, 4]);  // Shuffled copy of array
 */

export interface SeededRandom {
  /** Get next random number in range [0, 1) */
  next(): number;

  /** Get random integer in range [min, max] inclusive */
  nextInt(min: number, max: number): number;

  /** Pick random element from array */
  pick<T>(array: readonly T[]): T;

  /** Return a shuffled copy of array (Fisher-Yates with seeded RNG) */
  shuffle<T>(array: readonly T[]): T[];

  /** Get the seed string */
  readonly seed: string;
}

/**
 * Hash a string to a 32-bit unsigned integer using djb2 algorithm.
 * Simple, fast, and produces good distribution for our use case.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Mulberry32 PRNG - produces high quality random numbers.
 * Period is 2^32 which is sufficient for game puzzle generation.
 *
 * @param seed - 32-bit unsigned integer seed
 * @returns Function that returns next random number in [0, 1)
 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return function () {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded random number generator.
 *
 * @param seed - Any string (typically YYYY-MM-DD for daily challenges)
 * @returns SeededRandom instance with deterministic random methods
 *
 * @example
 * const rng = createSeededRandom('2025-01-01-magic-graph');
 * const puzzle = generatePuzzle(rng);  // Same puzzle every time for this seed
 */
export function createSeededRandom(seed: string): SeededRandom {
  const numericSeed = hashString(seed);
  const rng = mulberry32(numericSeed);

  return {
    seed,

    next(): number {
      return rng();
    },

    nextInt(min: number, max: number): number {
      return Math.floor(rng() * (max - min + 1)) + min;
    },

    pick<T>(array: readonly T[]): T {
      if (array.length === 0) {
        throw new Error('Cannot pick from empty array');
      }
      return array[Math.floor(rng() * array.length)];
    },

    shuffle<T>(array: readonly T[]): T[] {
      const result = [...array];
      // Fisher-Yates shuffle with seeded RNG
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
  };
}

/**
 * Get today's date as a seed string in YYYY-MM-DD format.
 * Uses local timezone to match user's perception of "today".
 */
export function getTodaySeed(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create a seeded RNG for a specific game on a specific date.
 * Combines date and game ID to ensure each game gets a unique puzzle per day.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param gameId - Game identifier ('magic-graph', 'sequence-race', 'shape-architect')
 * @returns SeededRandom instance unique to this date+game combination
 *
 * @example
 * const rng = createDailyRandom('2025-01-01', 'magic-graph');
 * // This will always generate the same puzzle for Jan 1, 2025 MagicGraph daily
 */
export function createDailyRandom(date: string, gameId: string): SeededRandom {
  return createSeededRandom(`${date}-${gameId}`);
}

/**
 * Get milliseconds until the next day (midnight local time).
 * Useful for countdown timers showing when daily challenges reset.
 */
export function getMillisecondsUntilTomorrow(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

/**
 * Format milliseconds as HH:MM:SS for countdown display.
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

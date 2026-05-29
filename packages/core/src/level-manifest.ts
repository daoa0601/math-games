import type { GradeBand } from "./profile.schema";

/**
 * One step in a solution trace — drives worked examples, replay, and the
 * worked-example → faded-scaffold → independent-solve progression.
 *
 * Steps are localized via `labelKey` (+ `params`), never raw text, so item
 * logic stays string-free and en/vi parity holds. `data` carries an optional
 * game-specific structured payload (e.g. a piece placement) for replay and is
 * opaque to core.
 */
export interface SolutionStep {
  readonly labelKey: string;
  readonly params?: Readonly<Record<string, string | number>>;
  readonly data?: Readonly<Record<string, unknown>>;
}

/**
 * One hint in a faded-scaffold hint path. `level` orders hints from most
 * explicit (low) to least explicit (high) so scaffolding can fade with
 * demonstrated mastery. Localized via `labelKey` (+ `params`).
 */
export interface HintStep {
  readonly labelKey: string;
  readonly params?: Readonly<Record<string, string | number>>;
  readonly level?: number;
}

/**
 * Pedagogical metadata for a generated or curated level. Carried on each game's
 * level config as an optional `manifest`, so it threads through the existing
 * catalog → resolveLevelConfig → scoring pipeline rather than a parallel path.
 *
 * Only `skillTags` is required; the rest is backfilled as it becomes available
 * (provenance for generated levels, solver-derived traces for solver-backed
 * games, etc.). `solutionTrace` and `hintPath` are SERVER-ONLY — they encode
 * the answer and must be stripped before a level reaches the browser.
 */
export interface LevelManifest {
  /** Skills this level exercises (stable glossary keys, e.g. "constraint_propagation"). */
  readonly skillTags: readonly string[];
  /** Misconceptions this level reveals or repairs (stable keys). */
  readonly misconceptionTags?: readonly string[];
  /** Structured difficulty signals (e.g. { lineCount: 3, hasParityConstraint: true }). */
  readonly difficultyFeatures?: Readonly<
    Record<string, number | boolean | string>
  >;
  /** Grade band this level targets; reuses the player-profile band. */
  readonly gradeBand?: GradeBand;
  /** Owning game id (redundant on a config, useful when the manifest travels alone). */
  readonly gameId?: string;
  /** Generator seed that produced this level (identity for reproducibility). */
  readonly seed?: string;
  /** Version of the generator/solver that produced this manifest. */
  readonly generatorVersion?: string;
  /** Ordered worked-example/replay steps. SERVER-ONLY — strip before sending to the client. */
  readonly solutionTrace?: readonly SolutionStep[];
  /** Faded-scaffold hint path. SERVER-ONLY — strip before sending to the client. */
  readonly hintPath?: readonly HintStep[];
}

import type { GradeBand } from "./profile.schema";

/**
 * One step in a solution trace — drives worked examples, replay, and the
 * worked-example → faded-scaffold → independent-solve progression.
 *
 * Steps are localized via `labelKey` (+ `params`), never raw text, so item
 * logic stays string-free and en/vi parity holds. `data` carries an optional
 * game-specific replay payload — flat serializable primitives (flatten nested
 * structure into keys) so the manifest stays server-fn / JSON serializable.
 */
export interface SolutionStep {
  readonly labelKey: string;
  readonly params?: Readonly<Record<string, string | number>>;
  readonly data?: Readonly<Record<string, string | number | boolean>>;
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

/**
 * Strip the SERVER-ONLY fields (solutionTrace, hintPath) from a manifest so it
 * is safe to send to the browser — they encode the answer. The result is still
 * a LevelManifest (those fields are optional); undefined values are omitted by
 * JSON serialization.
 */
export function toClientManifest(manifest: LevelManifest): LevelManifest {
  return { ...manifest, solutionTrace: undefined, hintPath: undefined };
}

/**
 * Diagnostic projection of a level's manifest, persisted alongside each
 * attempt (in `game_attempts.completion_json`) so attempts are keyed to the
 * skills and misconceptions the level exercised. This is the substrate for
 * skill-mastery achievements and teacher-facing misconception summaries.
 *
 * Outcome signals (completed/score/moves) already have dedicated attempt
 * columns; this carries only the pedagogical dimension that has no column.
 * The answer-bearing `solutionTrace`/`hintPath` are deliberately excluded.
 */
export interface AttemptDiagnostics {
  readonly skillTags: readonly string[];
  readonly misconceptionTags?: readonly string[];
  readonly difficultyFeatures?: Readonly<
    Record<string, number | boolean | string>
  >;
}

/**
 * Project a level's manifest into the {@link AttemptDiagnostics} record to log
 * with an attempt. Returns `null` for an un-tagged level so its
 * `completion_json` stays null rather than an empty object. Optional fields are
 * omitted when absent, keeping the persisted JSON minimal.
 */
export function buildAttemptDiagnostics(
  manifest: LevelManifest | undefined,
): AttemptDiagnostics | null {
  if (!manifest) return null;
  return {
    skillTags: manifest.skillTags,
    ...(manifest.misconceptionTags
      ? { misconceptionTags: manifest.misconceptionTags }
      : {}),
    ...(manifest.difficultyFeatures
      ? { difficultyFeatures: manifest.difficultyFeatures }
      : {}),
  };
}

/**
 * Map every config in a catalog through {@link toClientManifest}, so no level
 * served to the client carries its solution. Shape-preserving.
 */
export function toClientCatalog<
  T extends { manifest?: LevelManifest },
>(catalog: {
  config: T;
  configs: readonly T[];
  initialConfigId: string;
}): { config: T; configs: T[]; initialConfigId: string } {
  const strip = (config: T): T =>
    config.manifest
      ? ({ ...config, manifest: toClientManifest(config.manifest) } as T)
      : config;
  return {
    config: strip(catalog.config),
    configs: catalog.configs.map(strip),
    initialConfigId: catalog.initialConfigId,
  };
}

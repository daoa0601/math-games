/**
 * TypedStorage - Type-safe localStorage wrapper with Zod validation.
 *
 * Provides runtime validation of stored data, graceful error handling,
 * and migration support for schema changes.
 *
 * @example
 * ```typescript
 * const profileStorage = new TypedStorage(
 *   'player-profile',
 *   PlayerProfileSchema,
 *   createDefaultProfile()
 * );
 *
 * const profile = profileStorage.get(); // Always returns valid PlayerProfile
 * profileStorage.set({ ...profile, streak: 5 }); // Validates before storing
 * ```
 */

import { z } from 'zod';

export interface TypedStorageOptions<T> {
  /**
   * Called when stored data fails validation.
   * Useful for logging or analytics.
   */
  onValidationError?: (error: z.ZodError, rawData: unknown) => void;

  /**
   * Called when stored data is migrated.
   * Receives the old version number.
   */
  onMigration?: (fromVersion: number) => void;

  /**
   * Current schema version. If stored data has a lower version,
   * the migration function will be called.
   */
  version?: number;

  /**
   * Migration function to transform old data to new schema.
   * Receives raw data and should return data matching current schema.
   */
  migrate?: (rawData: unknown, fromVersion: number) => T;
}

/**
 * Type-safe localStorage wrapper with Zod validation.
 *
 * @template T - The validated data type (inferred from schema)
 */
export class TypedStorage<T> {
  private readonly storageKey: string;
  private readonly schema: z.ZodType<T>;
  private readonly defaultValue: T;
  private readonly options: TypedStorageOptions<T>;

  constructor(
    key: string,
    schema: z.ZodType<T>,
    defaultValue: T,
    options: TypedStorageOptions<T> = {}
  ) {
    this.storageKey = key;
    this.schema = schema;
    this.defaultValue = defaultValue;
    this.options = options;
  }

  /**
   * Get the stored value, validated against the schema.
   * Returns the default value if:
   * - No data is stored
   * - Stored data fails validation
   * - localStorage is unavailable
   */
  get(): T {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw === null) {
        return this.defaultValue;
      }

      const parsed = JSON.parse(raw);

      // Check for version migration
      if (this.options.version !== undefined && this.options.migrate) {
        const storedVersion =
          typeof parsed === 'object' && parsed !== null && 'version' in parsed
            ? (parsed as { version: number }).version
            : 0;

        if (storedVersion < this.options.version) {
          this.options.onMigration?.(storedVersion);
          const migrated = this.options.migrate(parsed, storedVersion);
          this.set(migrated); // Save migrated data
          return migrated;
        }
      }

      // Validate against schema
      const result = this.schema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }

      // Validation failed - log and return default
      this.options.onValidationError?.(result.error, parsed);
      console.warn(
        `[TypedStorage] Validation failed for "${this.storageKey}":`,
        result.error.issues
      );
      return this.defaultValue;
    } catch (error) {
      // JSON parse error or localStorage unavailable
      console.warn(
        `[TypedStorage] Failed to read "${this.storageKey}":`,
        error
      );
      return this.defaultValue;
    }
  }

  /**
   * Store a value after validating it against the schema.
   * Throws if the value doesn't match the schema (developer error).
   */
  set(value: T): void {
    // Validate before storing (catches developer errors)
    const result = this.schema.safeParse(value);
    if (!result.success) {
      console.error(
        `[TypedStorage] Invalid value for "${this.storageKey}":`,
        result.error.issues
      );
      throw new Error(
        `TypedStorage: Cannot store invalid data for "${this.storageKey}"`
      );
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(result.data));
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('[TypedStorage] localStorage quota exceeded');
        // Could implement cleanup strategy here
      }
      throw error;
    }
  }

  /**
   * Update the stored value using a transform function.
   * The transform receives the current value and should return the new value.
   */
  update(transform: (current: T) => T): T {
    const current = this.get();
    const updated = transform(current);
    this.set(updated);
    return updated;
  }

  /**
   * Remove the stored value.
   */
  remove(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore errors on remove
    }
  }

  /**
   * Check if a value is stored (regardless of validity).
   */
  exists(): boolean {
    try {
      return localStorage.getItem(this.storageKey) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Reset to the default value.
   */
  reset(): T {
    this.set(this.defaultValue);
    return this.defaultValue;
  }
}

/**
 * Create a TypedStorage instance for a simple key-value pair.
 * Useful for boolean flags, strings, or numbers.
 */
export function createSimpleStorage<T extends string | number | boolean>(
  key: string,
  schema: z.ZodType<T>,
  defaultValue: T
): TypedStorage<T> {
  return new TypedStorage(key, schema, defaultValue);
}

export default TypedStorage;

/**
 * Canonical Game Type Definitions
 *
 * Two ID formats exist for historical reasons:
 * - StorageGameId (kebab-case): Used in localStorage keys and achievement categories
 * - ComponentGameId (camelCase): Used in component props and i18n namespaces
 *
 * This file provides the single source of truth for both formats.
 */

// ============================================================================
// Game ID Types
// ============================================================================

/**
 * Game ID for storage operations (localStorage keys, achievement categories)
 * Uses kebab-case to match URL paths
 */
export type StorageGameId = 'magic-graph' | 'sequence-race' | 'shape-architect';

/**
 * Game ID for component props and i18n namespaces
 * Uses camelCase for JavaScript/React conventions
 */
export type ComponentGameId = 'magicGraph' | 'sequenceRace' | 'shapeArchitect';

/**
 * Array of all storage game IDs for iteration
 */
export const STORAGE_GAME_IDS: readonly StorageGameId[] = [
  'magic-graph',
  'sequence-race',
  'shape-architect',
] as const;

/**
 * Array of all component game IDs for iteration
 */
export const COMPONENT_GAME_IDS: readonly ComponentGameId[] = [
  'magicGraph',
  'sequenceRace',
  'shapeArchitect',
] as const;

// ============================================================================
// Conversion Maps
// ============================================================================

/**
 * Map from component ID to storage ID
 */
export const toStorageId: Record<ComponentGameId, StorageGameId> = {
  magicGraph: 'magic-graph',
  sequenceRace: 'sequence-race',
  shapeArchitect: 'shape-architect',
};

/**
 * Map from storage ID to component ID
 */
export const toComponentId: Record<StorageGameId, ComponentGameId> = {
  'magic-graph': 'magicGraph',
  'sequence-race': 'sequenceRace',
  'shape-architect': 'shapeArchitect',
};

// ============================================================================
// URL Paths
// ============================================================================

/**
 * Map from component ID to URL path (used in routing)
 */
export const toUrlPath: Record<ComponentGameId, string> = {
  magicGraph: '/magic-graph',
  sequenceRace: '/sequence-race',
  shapeArchitect: '/shape-architect',
};

// ============================================================================
// Achievement Categories
// ============================================================================

/**
 * Achievement category includes game IDs plus 'global'
 */
export type AchievementCategory = StorageGameId | 'global';

// ============================================================================
// Legacy Type Aliases (for gradual migration)
// ============================================================================

/**
 * @deprecated Use StorageGameId instead
 * Keeping for backwards compatibility during migration
 */
export type GameId = StorageGameId;

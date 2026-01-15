/**
 * Translation Lazy Loader
 *
 * Dynamically loads translation namespaces on demand.
 * This reduces initial bundle size by only loading common namespace upfront.
 *
 * `★ Insight ─────────────────────────────────────`
 * **Why this matters**: Currently, all 7 namespaces (~852 lines of translations)
 * are loaded at app initialization. With lazy loading:
 * - Initial load: Only common namespace (~400 lines)
 * - Game translations: Loaded with the game chunk
 * - Memory: Only active game's translations in memory
 *
 * This aligns with the lazy-loaded game chunks in App.tsx.
 * `─────────────────────────────────────────────────`
 */

import i18n from './index';

const loadedNamespaces = new Set<string>();

/**
 * Supported game namespaces for lazy loading
 */
export type GameNamespace = 'magicGraph' | 'sequenceRace' | 'shapeArchitect';

/**
 * Load translations for a specific game namespace
 *
 * This function is safe to call multiple times - it will only load
 * each namespace once and cache the result.
 *
 * @param game - The game namespace to load
 * @returns Promise that resolves when translations are loaded
 *
 * @example
 * ```ts
 * // When loading MagicGraph game
 * await loadGameTranslations('magicGraph');
 * ```
 */
export async function loadGameTranslations(game: GameNamespace): Promise<void> {
  const namespace = game;

  // Already loaded - skip
  if (loadedNamespaces.has(namespace)) {
    return;
  }

  // Get current language
  const lang = i18n.language;

  try {
    // Dynamic import based on current language
    const translations = await import(`./locales/${lang}/${game}.json`);

    // Add the translations to i18next
    i18n.addResourceBundle(lang, namespace, translations.default);

    loadedNamespaces.add(namespace);

    console.log(`[i18n] Loaded ${namespace} translations for ${lang}`);
  } catch (error) {
    console.error(`[i18n] Failed to load ${namespace} translations:`, error);
    // Fallback to English if current language fails
    if (lang !== 'en') {
      try {
        const fallbackTranslations = await import(`./locales/en/${game}.json`);
        i18n.addResourceBundle('en', namespace, fallbackTranslations.default);
        console.log(`[i18n] Loaded ${namespace} English fallback`);
      } catch (fallbackError) {
        console.error(`[i18n] Failed to load English fallback for ${namespace}:`, fallbackError);
      }
    }
  }
}

/**
 * Check if a namespace has been loaded
 *
 * @param namespace - The namespace to check
 * @returns True if the namespace has been loaded
 */
export function isNamespaceLoaded(namespace: string): boolean {
  return loadedNamespaces.has(namespace);
}

/**
 * Get list of loaded namespaces
 *
 * Useful for debugging and testing
 *
 * @returns Array of loaded namespace names
 */
export function getLoadedNamespaces(): string[] {
  return Array.from(loadedNamespaces);
}

/**
 * Clear all loaded namespaces (except common)
 *
 * Useful for testing or resetting state
 */
export function clearLoadedNamespaces(): void {
  loadedNamespaces.clear();
}

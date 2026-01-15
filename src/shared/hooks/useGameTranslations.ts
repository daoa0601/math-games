import { useTranslation } from 'react-i18next';
import type {
  AuthTranslationKeys,
  CommonTranslationKeys,
  KeyboardTranslationKeys,
  MagicGraphTranslationKeys,
  SequenceRaceTranslationKeys,
  ShapeArchitectTranslationKeys,
  SyncTranslationKeys,
} from '@/i18n/types';

/**
 * Supported game namespaces for translations
 */
export type GameNamespace = 'magicGraph' | 'sequenceRace' | 'shapeArchitect';

/**
 * Union type of all translation keys across all namespaces
 * Useful for generic translation utilities
 */
export type TranslationKeys =
  | AuthTranslationKeys
  | CommonTranslationKeys
  | KeyboardTranslationKeys
  | MagicGraphTranslationKeys
  | SequenceRaceTranslationKeys
  | ShapeArchitectTranslationKeys
  | SyncTranslationKeys;

/**
 * Unified translation hook for game components
 *
 * Provides both game-specific and common translation functions
 * in a single hook call, reducing cognitive overhead compared to
 * the dual-hook pattern (t + tc).
 *
 * @example
 * ```tsx
 * function MagicGraphGame() {
 *   const { t, tc } = useGameTranslations('magicGraph');
 *
 *   return (
 *     <div>
 *       <h1>{t('tutorial.step1Title')}</h1>  // From magicGraph namespace
 *       <button>{tc('buttons.reset')}</button>  // From common namespace
 *     </div>
 *   );
 * }
 * ```
 *
 * `★ Insight ─────────────────────────────────────`
 * **Why this matters**: The old pattern required calling `useTranslation` twice:
 * - `const { t } = useTranslation('magicGraph')`
 * - `const { t: tc } = useTranslation('common')`
 *
 * This was error-prone - developers had to remember which namespace
 * each key belonged to. The unified hook abstracts this complexity
 * and provides a consistent API across all games.
 * `─────────────────────────────────────────────────`
 */
export function useGameTranslations(game: GameNamespace) {
  const { t: gameT } = useTranslation(game);
  const { t: commonT } = useTranslation('common');

  return {
    /** Game-specific translation function (e.g., magicGraph, sequenceRace) */
    t: gameT,
    /** Common translation function (shared UI elements) */
    tc: commonT,
  };
}

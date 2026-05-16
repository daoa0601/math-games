import { coreTranslations } from '@math-games/core'
import { magicGraphModule } from '@math-games/game-magic-graph'
import { patternDetectiveModule } from '@math-games/game-pattern-detective'
import { sequenceRaceModule } from '@math-games/game-sequence-race'
import { shapeArchitectModule } from '@math-games/game-shape-architect'

const GAME_MODULES = [
  magicGraphModule,
  sequenceRaceModule,
  shapeArchitectModule,
  patternDetectiveModule,
] as const

const gameEn = Object.assign(
  {},
  ...GAME_MODULES.map((m) => m.translations.en),
) as Record<string, string>

const gameVi = Object.assign(
  {},
  ...GAME_MODULES.map((m) => m.translations.vi),
) as Record<string, string>

export const translations = {
  en: { ...coreTranslations.en, ...gameEn },
  vi: { ...coreTranslations.vi, ...gameVi },
}

export type Locale = keyof typeof coreTranslations
export type TranslationKey = keyof (typeof coreTranslations)['en']

export function t(locale: Locale, key: TranslationKey): string {
  return (translations[locale] as Record<string, string>)[key]
}

export function tx(locale: Locale, key: string, fallback: string): string {
  return (translations[locale] as Record<string, string>)[key] ?? fallback
}

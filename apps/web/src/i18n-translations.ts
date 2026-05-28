import { coreTranslations } from '@math-games/core'
import { GAME_MODULES } from '@/games/registry'

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

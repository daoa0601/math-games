import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Locale = 'en' | 'vi'

export type TranslationDict = Record<string, Record<string, string>>

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  tx: (key: string, fallback: string) => string
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  tx: (_, fallback) => fallback,
})

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('mg-locale')
  return stored === 'vi' ? 'vi' : 'en'
}

export function LocaleProvider({
  children,
  translations,
}: {
  children: ReactNode
  translations: TranslationDict
}) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(getStoredLocale())
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  function setLocale(next: Locale) {
    setLocaleState(next)
    localStorage.setItem('mg-locale', next)
  }

  const value = useMemo<LocaleContextValue>(() => {
    const dict = (translations[locale] ?? translations['en'] ?? {}) as Record<string, string>
    return {
      locale,
      setLocale,
      t: (key: string) => dict[key] ?? key,
      tx: (key: string, fallback: string) => dict[key] ?? fallback,
    }
  }, [locale, translations])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

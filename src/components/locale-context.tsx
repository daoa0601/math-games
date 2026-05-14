import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Locale = 'en' | 'vi'

const LocaleContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
}>({
  locale: 'en',
  setLocale: () => {},
})

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('mg-locale')
  return stored === 'vi' ? 'vi' : 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(getStoredLocale())
  }, [])

  function setLocale(next: Locale) {
    setLocaleState(next)
    localStorage.setItem('mg-locale', next)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

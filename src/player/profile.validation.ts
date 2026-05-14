export const locales = ['en', 'vi'] as const
export const gradeBands = ['elementary', 'middle', 'high'] as const

export type Locale = (typeof locales)[number]
export type GradeBand = (typeof gradeBands)[number]

export interface UpdatePlayerProfileInput {
  displayName: string
  locale: Locale
  gradeBand: GradeBand
}

const displayNameMaxLength = 40

function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

function isGradeBand(value: string): value is GradeBand {
  return gradeBands.includes(value as GradeBand)
}

export function validatePlayerProfileInput(
  data: unknown,
): UpdatePlayerProfileInput {
  if (data === null || typeof data !== 'object') {
    throw new Error('Invalid player profile payload')
  }

  const payload = data as Record<string, unknown>
  const displayName =
    typeof payload.displayName === 'string'
      ? payload.displayName.trim().replace(/\s+/g, ' ')
      : ''
  const locale = typeof payload.locale === 'string' ? payload.locale : ''
  const gradeBand =
    typeof payload.gradeBand === 'string' ? payload.gradeBand : ''

  if (
    displayName.length < 2 ||
    displayName.length > displayNameMaxLength ||
    !isLocale(locale) ||
    !isGradeBand(gradeBand)
  ) {
    throw new Error('Invalid player profile payload')
  }

  return {
    displayName,
    locale,
    gradeBand,
  }
}

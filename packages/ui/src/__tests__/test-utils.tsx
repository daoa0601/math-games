import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

import { LocaleProvider } from '../locale-context'
import type { TranslationDict } from '../locale-context'

const defaultTranslations: TranslationDict = {
  en: {
    'toggle.darkMode': 'Switch to dark mode',
    'toggle.lightMode': 'Switch to light mode',
    'toggle.languageToVietnamese': 'Switch to Vietnamese',
    'toggle.languageToEnglish': 'Switch to English',
    'toggle.collapse': 'Collapse',
    'toggle.expand': 'Expand',
    'game.learn': 'Learn',
  },
  vi: {
    'toggle.darkMode': 'Chuyển sang chế độ tối',
    'toggle.lightMode': 'Chuyển sang chế độ sáng',
    'toggle.languageToVietnamese': 'Chuyển sang tiếng Việt',
    'toggle.languageToEnglish': 'Chuyển sang tiếng Anh',
    'toggle.collapse': 'Thu gọn',
    'toggle.expand': 'Mở rộng',
    'game.learn': 'Tìm hiểu',
  },
}

export function renderWithLocale(
  ui: ReactNode,
  translations: TranslationDict = defaultTranslations,
) {
  return render(
    <LocaleProvider translations={translations}>{ui}</LocaleProvider>,
  )
}

import { useLocale } from '@/components/locale-context'
import { t } from '@/components/translations'

export function useT() {
  const { locale } = useLocale()
  return (key: Parameters<typeof t>[1]) => t(locale, key)
}

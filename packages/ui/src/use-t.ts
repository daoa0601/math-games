import { useLocale } from './locale-context'

export function useT() {
  const { t } = useLocale()
  return t
}

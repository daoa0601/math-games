import { useLocale } from '@/components/locale-context'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/use-t'

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  const t = useT()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
      aria-label={
        locale === 'en'
          ? t('toggle.languageToVietnamese')
          : t('toggle.languageToEnglish')
      }
      type="button"
      className="text-xs font-semibold"
    >
      {locale === 'en' ? 'VI' : 'EN'}
    </Button>
  )
}

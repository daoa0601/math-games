import { useLocale } from '@/components/locale-context'
import { Button } from '@/components/ui/button'

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
      aria-label={locale === 'en' ? 'Switch to Vietnamese' : 'Switch to English'}
      type="button"
      className="text-xs font-semibold"
    >
      {locale === 'en' ? 'VI' : 'EN'}
    </Button>
  )
}

import { formatLevelName } from '@/i18n-format'
import { useLocale } from '@math-games/ui'

interface LevelGridItem {
  id: string
  name: string
  subtitle: string
}

interface LevelGridProps {
  items: readonly LevelGridItem[]
  selectedId: string
  onSelect: (id: string) => void
}

export function LevelGrid({ items, selectedId, onSelect }: LevelGridProps) {
  const { locale } = useLocale()

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const selected = item.id === selectedId

        return (
          <button
            className={
              selected
                ? 'rounded-lg border border-primary bg-primary px-4 py-4 text-left text-primary-foreground'
                : 'rounded-lg border border-border px-4 py-4 text-left hover:border-primary'
            }
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <span className="block font-semibold">
              {formatLevelName(locale, item.name)}
            </span>
            <span className="mt-1 block text-sm capitalize opacity-80">
              {item.subtitle}
            </span>
          </button>
        )
      })}
    </div>
  )
}

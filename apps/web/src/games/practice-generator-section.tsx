import { useState } from 'react'

import { Button } from '@math-games/ui'
import { ResponsiveSection } from '@math-games/ui'
import { useT } from '@math-games/ui'

interface DifficultyOption {
  value: string
  label: string
}

interface PracticeGeneratorSectionProps {
  title: string
  description: string
  difficulties: DifficultyOption[]
  defaultDifficulty?: string
  onGenerate: (seed: string, difficulty: string) => void
  children: React.ReactNode
}

export function PracticeGeneratorSection({
  title,
  description,
  difficulties,
  defaultDifficulty,
  onGenerate,
  children,
}: PracticeGeneratorSectionProps) {
  const t = useT()
  const [practiceSeed, setPracticeSeed] = useState('')
  const [practiceDifficulty, setPracticeDifficulty] = useState(
    defaultDifficulty ?? difficulties[0]?.value ?? 'medium',
  )

  function handleGenerate() {
    const seed = practiceSeed.trim() || `practice-${Date.now()}`
    onGenerate(seed, practiceDifficulty)
  }

  return (
    <ResponsiveSection
      title={title}
      description={description}
      className="border-y border-border py-5"
      actions={
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            aria-label={t('game.practiceSeed')}
            className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
            onChange={(event) => setPracticeSeed(event.currentTarget.value)}
            placeholder={t('game.practiceSeed')}
            value={practiceSeed}
          />
          <select
            aria-label={t('game.practiceDifficulty')}
            className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
            onChange={(event) =>
              setPracticeDifficulty(event.currentTarget.value)
            }
            value={practiceDifficulty}
          >
            {difficulties.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button onClick={handleGenerate} type="button">
            {t('game.generate')}
          </Button>
        </div>
      }
    >
      {children}
    </ResponsiveSection>
  )
}

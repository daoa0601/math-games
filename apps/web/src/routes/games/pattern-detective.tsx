import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'

import type { TranslationKey } from '@/i18n-translations'
import { formatAchievementName, formatDifficulty } from '@/i18n-format'
import { Confetti, GameChrome } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { validateLevelSearch } from '@/games/level-search'
import type { PatternConfig } from '@math-games/game-pattern-detective'
import {
  getPatternDetectiveCatalog,
  recordPatternDetectiveProgress,
} from '@/games/pattern-detective.functions'
import { shuffleChoices } from '@math-games/game-pattern-detective'
import {
  formatSavedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/pattern-detective')({
  validateSearch: validateLevelSearch,
  loader: () => getPatternDetectiveCatalog(),
  component: PatternDetectiveRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})

function PatternDetectiveRoute() {
  const t = useT()
  const { locale } = useLocale()
  const { configs, initialConfigId } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordPatternDetectiveProgress)

  const initialId = searchLevel ?? initialConfigId
  const [currentLevelId, setCurrentLevelId] = useState(initialId)
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const level = configs.find((c) => c.id === currentLevelId) ?? configs[0]

  const choices = useMemo(
    () => shuffleChoices(level.answer, level.distractors, hashStr(level.id)),
    [level],
  )

  const progressLabels = { unlocked: t('status.unlocked') }

  async function handleSubmit(answer: number) {
    setSelected(answer)
    const correct = answer === level.answer
    setResult(correct ? 'correct' : 'wrong')

    const res = await runServerAction(
      () =>
        recordProgress({
          data: {
            levelId: level.id,
            completion: { selectedAnswer: answer },
          },
        }),
      t('status.progressSaveFailed'),
    )

    if (res.ok) {
      const msg = formatSavedProgress(res.value, progressLabels, (id) =>
        formatAchievementName(locale, id),
      )
      if (msg) setSaveStatus(msg)
    }
  }

  function handleNext() {
    const idx = configs.indexOf(level)
    const next = configs[idx + 1] ?? configs[0]
    setCurrentLevelId(next.id)
    setSelected(null)
    setResult(null)
    setSaveStatus(null)
  }

  return (
    <main className="theme-pattern-detective mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <GameChrome
        game="pattern-detective"
        levelTitle={t('gameTitle.patternDetective')}
      />

      <LevelSelector
        configs={configs}
        currentId={level.id}
        locale={locale}
        onSelect={(id) => {
          setCurrentLevelId(id)
          setSelected(null)
          setResult(null)
          setSaveStatus(null)
        }}
      />

      <div className="relative">
        <Confetti
          active={result === 'correct'}
          colors={['#a06420', '#c88848', '#d9a06d', '#8a5318', '#e8c590']}
        />
      </div>

      <SequenceCard
        level={level}
        choices={choices}
        selected={selected}
        result={result}
        onSelect={handleSubmit}
      />

      {result && (
        <ResultCard
          result={result}
          answer={level.answer}
          hint={level.hint}
          saveStatus={saveStatus}
          onNext={handleNext}
          t={t}
        />
      )}
    </main>
  )
}

function LevelSelector({
  configs,
  currentId,
  locale,
  onSelect,
}: {
  configs: readonly PatternConfig[]
  currentId: string
  locale: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {configs.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            c.id === currentId
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {formatDifficulty(locale as 'en' | 'vi', c.difficulty)}
          {' · '}
          {c.patternType}
        </button>
      ))}
    </div>
  )
}

function SequenceCard({
  level,
  choices,
  selected,
  result,
  onSelect,
}: {
  level: PatternConfig
  choices: number[]
  selected: number | null
  result: 'correct' | 'wrong' | null
  onSelect: (answer: number) => void
}) {
  const answered = result !== null

  return (
    <Card className="game-card-bg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">{level.patternType}</Badge>
          <Badge variant="secondary">{level.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-2xl">
          {level.sequence.map((n, i) => (
            <span
              key={i}
              className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 ${
                i === level.missingIndex
                  ? 'border-primary bg-primary/10 font-bold text-primary'
                  : 'border-border bg-card'
              }`}
            >
              {i === level.missingIndex ? (answered ? level.answer : '?') : n}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {choices.map((choice) => {
            let variant: 'default' | 'outline' | 'destructive' | 'secondary' =
              'outline'
            if (answered && choice === level.answer) variant = 'default'
            else if (answered && choice === selected) variant = 'destructive'

            return (
              <Button
                key={choice}
                variant={variant}
                size="lg"
                className="font-mono text-lg"
                disabled={answered}
                onClick={() => onSelect(choice)}
              >
                {choice}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ResultCard({
  result,
  answer,
  hint,
  saveStatus,
  onNext,
  t,
}: {
  result: 'correct' | 'wrong'
  answer: number
  hint?: string
  saveStatus: string | null
  onNext: () => void
  t: (key: TranslationKey) => string
}) {
  return (
    <Card
      className={
        result === 'correct'
          ? 'animate-scale-in border-success/40 bg-success/[0.05] shadow-(--card-shadow-long)'
          : 'animate-scale-in border-destructive/40 bg-destructive/[0.05] shadow-(--card-shadow-long)'
      }
    >
      <CardContent className="flex flex-col gap-3">
        <p
          className={
            result === 'correct'
              ? 'font-display text-lg font-medium tracking-tight text-success'
              : 'font-display text-lg font-medium tracking-tight text-destructive'
          }
        >
          {result === 'correct' ? t('stats.solved') : t('game.tryAgain')}
        </p>
        {result === 'wrong' && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            The answer is{' '}
            <span className="font-medium text-foreground tabular-nums">
              {answer}
            </span>
            .{hint ? ` Hint: ${hint}` : ''}
          </p>
        )}
        {saveStatus && (
          <p className="text-sm text-muted-foreground">{saveStatus}</p>
        )}
        <Button onClick={onNext} className="self-start">
          Next Level
        </Button>
      </CardContent>
    </Card>
  )
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h >>> 0
}

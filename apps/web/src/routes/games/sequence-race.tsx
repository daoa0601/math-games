import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Confetti } from '@math-games/ui'
import { GamePattern } from '@math-games/ui'
import {
  formatAchievementName,
  formatActor,
  formatDifficulty,
  formatLevelName,
} from '@/i18n-format'
import { LanguageToggle } from '@math-games/ui'
import { getHints } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { LearnSection } from '@math-games/ui'
import { ResponsiveSection } from '@math-games/ui'
import { ThemeToggle } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent } from '@math-games/ui'
import { Progress } from '@math-games/ui'
import { useGameSession } from '@math-games/ui'
import { validateLevelSearch } from '@/games/level-search'
import {
  applyMove,
  createGameState,
  getAIMove,
  getValidMoves,
  isHumanTurn,
} from '@math-games/game-sequence-race'
import type {
  GameConfig,
  SequenceInfo,
  SequenceState,
} from '@math-games/game-sequence-race'
import { getSequenceRacePracticeConfig } from '@math-games/game-sequence-race'
import type { SequenceRaceDifficulty } from '@math-games/game-sequence-race'
import {
  getSequenceRaceLevel,
  recordSequenceRaceProgress,
} from '@/games/sequence-race.functions'
import {
  formatSavedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { useT } from '@math-games/ui'

export const Route = createFileRoute('/games/sequence-race')({
  validateSearch: validateLevelSearch,
  loader: () => getSequenceRaceLevel(),
  component: SequenceRaceRoute,
})

const AI_MOVE_DELAY_MS = 650

function SequenceRaceRoute() {
  const t = useT()
  const { locale } = useLocale()
  const { configs, initialConfigId, sequenceInfoByType } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordSequenceRaceProgress)
  const [availableConfigs, setAvailableConfigs] = useState(configs)
  const [practiceSeed, setPracticeSeed] = useState('')
  const [practiceDifficulty, setPracticeDifficulty] =
    useState<SequenceRaceDifficulty>('medium')
  const requestedLevelId = searchLevel
    ? (availableConfigs.find((candidate) => candidate.id === searchLevel)?.id ??
      initialConfigId)
    : undefined
  const [selectedLevelId, setSelectedLevelId] = useState(
    requestedLevelId ?? initialConfigId,
  )
  const config = useMemo(
    () =>
      availableConfigs.find((candidate) => candidate.id === selectedLevelId) ??
      availableConfigs[0],
    [availableConfigs, selectedLevelId],
  )
  const sequence = config.stepPool
  const sequenceType = config.sequenceType ?? 'arithmetic'
  const sequenceInfo: SequenceInfo = sequenceInfoByType[sequenceType]
  const [game, setGame] = useState(() => createGameState(config))
  const [aiThinking, setAiThinking] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [levelAttempts, setLevelAttempts] = useState(0)

  useEffect(() => {
    if (!saveStatus) return
    const timer = setTimeout(() => setSaveStatus(null), 5000)
    return () => clearTimeout(timer)
  }, [saveStatus])

  const validMoves = useMemo(() => getValidMoves(game), [game])
  const humanTurn = isHumanTurn(game)
  const session = useGameSession({
    completed: game.gameOver,
    resetKey: config.id,
  })
  const hints = getHints('sequence-race', locale)
  const progressLabels = { unlocked: t('status.unlocked') }

  useEffect(() => {
    if (!requestedLevelId) return

    const nextConfig =
      availableConfigs.find((candidate) => candidate.id === requestedLevelId) ??
      availableConfigs[0]

    if (nextConfig.id === selectedLevelId) return

    setSelectedLevelId(nextConfig.id)
    setGame(createGameState(nextConfig))
    setAiThinking(false)
    setSaveStatus(null)
  }, [availableConfigs, requestedLevelId, selectedLevelId])

  const progressPercent = Math.round((game.currentPosition / game.target) * 100)

  const finishTurn = useCallback(
    async function finishTurn(nextGame: SequenceState) {
      setGame(nextGame)

      if (!nextGame.gameOver) {
        setSaveStatus(null)
        return
      }

      const result = await runServerAction(
        () =>
          recordProgress({
            data: {
              levelId: config.id,
              completion: {
                history: nextGame.history.map((entry) => ({
                  actor: entry.actor,
                  step: entry.step,
                })),
              },
            },
          }),
        t('status.progressSaveFailed'),
      )

      if (!result.ok) {
        setSaveStatus(result.message)
        return
      }

      setLevelAttempts(result.value.attempts)
      setSaveStatus(
        formatSavedProgress(result.value, progressLabels, (achievementId) =>
          formatAchievementName(locale, achievementId),
        ),
      )
    },
    [config.id, recordProgress],
  )

  useEffect(() => {
    if (session.timedOut || game.gameOver || game.turn !== 'ai') {
      setAiThinking(false)
      return
    }

    setAiThinking(true)

    const timer = window.setTimeout(() => {
      const aiMove = getAIMove(game, config.difficulty)
      const nextGame = applyMove(game, aiMove)

      setAiThinking(false)
      void finishTurn(nextGame)
    }, AI_MOVE_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [config.difficulty, finishTurn, game, session.timedOut])

  async function playMove(step: number) {
    if (session.timedOut) return
    if (!humanTurn || aiThinking) return

    const nextGame = applyMove(game, step)

    await finishTurn(nextGame)
  }

  function resetGame() {
    setGame(createGameState(config))
    setAiThinking(false)
    setSaveStatus(null)
    session.resetSession()
  }

  function selectLevel(nextLevel: GameConfig) {
    setSelectedLevelId(nextLevel.id)
    setGame(createGameState(nextLevel))
    setAiThinking(false)
    setSaveStatus(null)
    setLevelAttempts(0)
    session.resetSession()
  }

  function generatePracticeLevel() {
    const seed = practiceSeed.trim() || `practice-${Date.now()}`
    const nextConfig = getSequenceRacePracticeConfig(seed, practiceDifficulty)

    setAvailableConfigs((currentConfigs) => [
      nextConfig,
      ...currentConfigs.filter((candidate) => candidate.id !== nextConfig.id),
    ])
    selectLevel(nextConfig)
  }

  return (
    <main className="theme-sequence-race mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 py-3 -mx-4 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
            to="/"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="truncate text-lg font-bold tracking-tight md:text-2xl">
            {formatLevelName(locale, config.name)}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
            {t('game.target')} {config.target}
          </span>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <section className="relative grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Confetti
          active={game.winner === 'player'}
          colors={['#f97316', '#fb923c', '#fdba74', '#ea580c', '#fbbf24']}
        />
        <Card className="relative overflow-hidden border border-primary/15 shadow-xl shadow-primary/5">
          <GamePattern pattern="arrows" />
          <CardContent className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t('game.raceLine')}</h2>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={
                      session.mode === 'practice' ? 'default' : 'outline'
                    }
                    onClick={() => session.setMode('practice')}
                    type="button"
                  >
                    {t('game.practice')}
                  </Button>
                  <Button
                    size="sm"
                    variant={session.mode === 'timed' ? 'default' : 'outline'}
                    onClick={() => session.setMode('timed')}
                    type="button"
                  >
                    {t('game.timed')}
                  </Button>
                </div>
                <Badge variant={session.timedOut ? 'destructive' : 'secondary'}>
                  {session.mode === 'timed'
                    ? `${Math.floor(session.remainingSeconds / 60)}:${(session.remainingSeconds % 60).toString().padStart(2, '0')}`
                    : `${Math.floor(session.elapsedSeconds / 60)}:${(session.elapsedSeconds % 60).toString().padStart(2, '0')}`}
                </Badge>
              </div>
            </div>

            <Progress className="mt-5 h-4" value={progressPercent} />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sequence.map((step, index) => (
                <Button
                  variant="outline"
                  size="lg"
                  className="py-4 text-lg"
                  disabled={
                    game.gameOver ||
                    session.timedOut ||
                    aiThinking ||
                    !humanTurn ||
                    !validMoves.includes(step)
                  }
                  key={`${step}-${index}`}
                  onClick={() => void playMove(step)}
                  type="button"
                >
                  +{step}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={aiThinking ? 'secondary' : 'default'}>
                    {aiThinking
                      ? t('game.aiThinking')
                      : formatActor(locale, game.turn)}
                  </Badge>
                  {game.winner ? (
                    <Badge
                      variant={
                        game.winner === 'player' || game.winner === 'player1'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {formatActor(locale, game.winner)} {t('game.wins')}
                    </Badge>
                  ) : null}
                </div>
                <span className="text-sm text-muted-foreground capitalize">
                  {formatDifficulty(locale, config.difficulty)} ·{' '}
                  {sequenceInfo.formula}
                  {levelAttempts > 0
                    ? ` · ${t('profile.attempts')} ${levelAttempts}`
                    : ''}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetGame}
                  type="button"
                >
                  {t('game.reset')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => session.setPaused(!session.paused)}
                  type="button"
                >
                  {session.paused ? t('game.resume') : t('game.pause')}
                </Button>
              </div>

              {saveStatus ? (
                <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                  {saveStatus}
                </p>
              ) : null}

              {session.timedOut ? (
                <p className="mt-3 border-t border-border pt-3 text-sm font-medium text-destructive">
                  {t('game.timedOut')}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {hints.length > 0 ? (
            <Card className="border-0 shadow-lg bg-primary/5">
              <CardContent>
                <h3 className="text-sm font-bold text-primary">{t('game.hints')}</h3>
                <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                  {hints.map((hint) => (
                    <li key={hint}>- {hint}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <ResponsiveSection
        title={t('game.levels')}
        description={t('game.levelsDescription')}
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
                setPracticeDifficulty(
                  event.currentTarget.value as SequenceRaceDifficulty,
                )
              }
              value={practiceDifficulty}
            >
              <option value="easy">{t('diff.easy')}</option>
              <option value="medium">{t('diff.medium')}</option>
              <option value="hard">{t('diff.hard')}</option>
            </select>
            <Button onClick={generatePracticeLevel} type="button">
              {t('game.generate')}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableConfigs.map((optionLevel) => {
            const levelSequenceType = optionLevel.sequenceType ?? 'arithmetic'
            const info = sequenceInfoByType[levelSequenceType]
            const selected = optionLevel.id === config.id

            return (
              <button
                className={
                  selected
                    ? 'rounded-lg border border-primary bg-primary px-4 py-4 text-left text-primary-foreground'
                    : 'rounded-lg border border-border px-4 py-4 text-left hover:border-primary'
                }
                key={optionLevel.id}
                onClick={() => selectLevel(optionLevel)}
                type="button"
              >
                <span className="block font-semibold">
                  {formatLevelName(locale, optionLevel.name)}
                </span>
                <span className="mt-1 block text-sm capitalize opacity-80">
                  {formatDifficulty(locale, optionLevel.difficulty)} ·{' '}
                  {formatLevelName(locale, info.name)} · {t('game.target')}{' '}
                  {optionLevel.target}
                </span>
              </button>
            )
          })}
        </div>
      </ResponsiveSection>

      <LearnSection gameId="sequence-race" />
    </main>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Confetti } from '@/components/confetti'
import { GameSessionPanel } from '@/components/game-session-panel'
import { GamePattern } from '@/components/game-pattern'
import { LanguageToggle } from '@/components/language-toggle'
import { learnContent } from '@/components/learn-content'
import { useLocale } from '@/components/locale-context'
import { LearnSection } from '@/components/learn-section'
import { ResponsiveSection } from '@/components/responsive-section'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useGameSession } from '@/components/use-game-session'
import { validateLevelSearch } from '@/games/level-search'
import {
  applyMove,
  createGameState,
  getAIMove,
  getValidMoves,
  isHumanTurn,
} from '@/games/SequenceRace/logic'
import type {
  GameConfig,
  SequenceInfo,
  SequenceState,
} from '@/games/SequenceRace/logic'
import { getSequenceRacePracticeConfig } from '@/games/SequenceRace/sequence-race.catalog'
import type { SequenceRaceDifficulty } from '@/games/SequenceRace/sequence-race.catalog'
import {
  getSequenceRaceLevel,
  recordSequenceRaceProgress,
} from '@/games/SequenceRace/sequence-race.functions'
import {
  formatSavedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { useT } from '@/components/use-t'

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
  const validMoves = useMemo(() => getValidMoves(game), [game])
  const humanTurn = isHumanTurn(game)
  const session = useGameSession({
    completed: game.gameOver,
    resetKey: config.id,
  })
  const hints = learnContent['sequence-race'][locale].tips.items ?? []

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
        'Progress save failed.',
      )

      if (!result.ok) {
        setSaveStatus(result.message)
        return
      }

      setSaveStatus(formatSavedProgress(result.value))
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
    <main className="theme-sequence-race mx-auto flex min-h-screen max-w-5xl flex-col gap-5 px-4 py-6 md:gap-8 md:px-6 md:py-8">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
            to="/"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="truncate text-lg font-semibold md:text-2xl">
            {config.name}
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
        <Card className="relative overflow-hidden">
          <GamePattern pattern="arrows" />
          <CardContent className="relative">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">{t('game.raceLine')}</h2>
              <span className="text-sm text-muted-foreground">
                {game.currentPosition} / {game.target}
              </span>
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
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={aiThinking ? 'secondary' : 'default'}>
                    {aiThinking ? 'AI thinking' : game.turn}
                  </Badge>
                  {game.winner ? (
                    <Badge
                      variant={
                        game.winner === 'player' || game.winner === 'player1'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {game.winner} {t('game.wins')}
                    </Badge>
                  ) : null}
                </div>
                <span className="text-sm text-muted-foreground capitalize">
                  {config.difficulty} · {sequenceInfo.formula}
                </span>
              </div>

              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={resetGame}
                type="button"
              >
                {t('game.reset')}
              </Button>
            </CardContent>
          </Card>

          <GameSessionPanel
            elapsedSeconds={session.elapsedSeconds}
            hints={hints}
            labels={{
              hints: t('game.hints'),
              pause: t('game.pause'),
              practice: t('game.practice'),
              resume: t('game.resume'),
              timed: t('game.timed'),
              timedOut: t('game.timedOut'),
            }}
            metricLabel={t('game.target')}
            metricValue={`${game.currentPosition}/${game.target}`}
            mode={session.mode}
            paused={session.paused}
            remainingSeconds={session.remainingSeconds}
            status={saveStatus}
            timedOut={session.timedOut}
            onModeChange={session.setMode}
            onPausedChange={session.setPaused}
          />
        </div>
      </section>

      <ResponsiveSection
        title={t('game.levels')}
        description="Presets and seeded practice levels share the same portable engine."
        className="border-y border-border py-5"
        actions={
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              aria-label="Practice seed"
              className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
              onChange={(event) => setPracticeSeed(event.currentTarget.value)}
              placeholder="Practice seed"
              value={practiceSeed}
            />
            <select
              aria-label="Practice difficulty"
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
                <span className="block font-semibold">{optionLevel.name}</span>
                <span className="mt-1 block text-sm capitalize opacity-80">
                  {optionLevel.difficulty} · {info.name} · target{' '}
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

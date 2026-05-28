import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Confetti } from '@math-games/ui'
import {
  formatAchievementName,
  formatActor,
  formatDifficulty,
  formatLevelName,
} from '@/i18n-format'
import { GameChrome, LevelNav, MobileGameHeader } from '@math-games/ui'
import { useNavigate } from '@tanstack/react-router'
import { getHints } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { LearnSection } from '@math-games/ui'
import { LevelGrid } from '@/games/level-grid'
import { PracticeGeneratorSection } from '@/games/practice-generator-section'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent } from '@math-games/ui'
import { Progress } from '@math-games/ui'
import {
  useGameSession,
  useLevelSelection,
  useSaveStatus,
} from '@math-games/ui'
import { validateLevelSearch } from '@/games/level-search'
import {
  applyMove,
  createGameState,
  getAIMove,
  getValidMoves,
  isHumanTurn,
  SEQUENCE_INFO,
} from '@math-games/game-sequence-race'
import type {
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
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'
import { useT } from '@math-games/ui'

export const Route = createFileRoute('/games/sequence-race')({
  validateSearch: validateLevelSearch,
  loader: () => getSequenceRaceLevel(),
  component: SequenceRaceRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})

const AI_MOVE_DELAY_MS = 650

function SequenceRaceRoute() {
  const t = useT()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const { configs, initialConfigId } = Route.useLoaderData()
  const sequenceInfoByType = SEQUENCE_INFO
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordSequenceRaceProgress)
  const { saveStatus, setSaveStatus, clearSaveStatus } = useSaveStatus()

  const {
    config,
    configIndex,
    availableConfigs,
    selectLevel,
    addAndSelectConfig,
  } = useLevelSelection({
    configs,
    initialConfigId,
    searchLevel,
    onReset: (newConfig) => {
      setGame(createGameState(newConfig))
      setAiThinking(false)
      clearSaveStatus()
    },
  })

  const sequence = config.stepPool
  const sequenceType = config.sequenceType ?? 'arithmetic'
  const sequenceInfo: SequenceInfo = sequenceInfoByType[sequenceType]
  const [game, setGame] = useState(() => createGameState(config))
  const [aiThinking, setAiThinking] = useState(false)
  const [levelAttempts, setLevelAttempts] = useState(0)

  const validMoves = useMemo(() => getValidMoves(game), [game])
  const humanTurn = isHumanTurn(game)
  const session = useGameSession({
    completed: game.gameOver,
    resetKey: config.id,
  })
  const hints = getHints('sequence-race', locale)
  const progressLabels = { unlocked: t('status.unlocked') }

  const progressPercent = Math.round((game.currentPosition / game.target) * 100)

  const finishTurn = useCallback(
    async function finishTurn(nextGame: SequenceState) {
      setGame(nextGame)

      if (!nextGame.gameOver) {
        clearSaveStatus()
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
    clearSaveStatus()
    session.resetSession()
  }

  function generatePracticeLevel(seed: string, difficulty: string) {
    const nextConfig = getSequenceRacePracticeConfig(
      seed,
      difficulty as SequenceRaceDifficulty,
    )
    addAndSelectConfig(nextConfig)
  }

  const timerLabel =
    session.mode === 'timed'
      ? `${Math.floor(session.remainingSeconds / 60)
          .toString()
          .padStart(2, '0')}:${(session.remainingSeconds % 60)
          .toString()
          .padStart(2, '0')}`
      : `${Math.floor(session.elapsedSeconds / 60)
          .toString()
          .padStart(2, '0')}:${(session.elapsedSeconds % 60)
          .toString()
          .padStart(2, '0')}`
  const turnsTaken = game.history.length
  const playerTurns = game.history.filter(
    (entry) => entry.actor === 'player',
  ).length

  return (
    <>
      {/* ── DESKTOP LAYOUT (≥ md) ────────────────────────────── */}
      <main className="theme-sequence-race mx-auto hidden min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:flex md:gap-10 md:px-6 md:py-10">
        <GameChrome
          game="sequence-race"
          levelTitle={formatLevelName(locale, config.name)}
          meta={
            <div className="flex items-center gap-2">
              <LevelNav
                currentIndex={configIndex}
                total={availableConfigs.length}
                onPrev={() => selectLevel(availableConfigs[configIndex - 1])}
                onNext={() => selectLevel(availableConfigs[configIndex + 1])}
              />
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium tabular-nums text-primary">
                {t('game.target')} {config.target}
              </span>
            </div>
          }
        />

        <section className="relative grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <Confetti active={game.winner === 'player'} />
          <Card className="game-card-bg relative overflow-hidden border-0">
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
                  <Badge
                    variant={session.timedOut ? 'destructive' : 'secondary'}
                  >
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
            <Card className="border border-border/60 shadow-(--card-shadow-long)">
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
              <Card className="border border-primary/15 bg-primary/[0.04] shadow-none">
                <CardContent>
                  <h3 className="text-sm font-bold text-primary">
                    {t('game.hints')}
                  </h3>
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

        <PracticeGeneratorSection
          title={t('game.levels')}
          description={t('game.levelsDescription')}
          difficulties={[
            { value: 'easy', label: t('diff.easy') },
            { value: 'medium', label: t('diff.medium') },
            { value: 'hard', label: t('diff.hard') },
          ]}
          defaultDifficulty="medium"
          onGenerate={generatePracticeLevel}
        >
          <LevelGrid
            items={availableConfigs.map((optionLevel) => {
              const info =
                sequenceInfoByType[optionLevel.sequenceType ?? 'arithmetic']
              return {
                id: optionLevel.id,
                name: optionLevel.name,
                subtitle: `${formatDifficulty(locale, optionLevel.difficulty)} · ${formatLevelName(locale, info.name)} · ${t('game.target')} ${optionLevel.target}`,
              }
            })}
            selectedId={config.id}
            onSelect={(id) => {
              const level = availableConfigs.find((c) => c.id === id)
              if (level) selectLevel(level)
            }}
          />
        </PracticeGeneratorSection>

        <LearnSection gameId="sequence-race" />
      </main>

      {/* ── MOBILE LAYOUT (< md) ─────────────────────────────── */}
      <div className="theme-sequence-race body-noise flex min-h-screen flex-col md:hidden">
        <MobileGameHeader
          game="sequence-race"
          levelTitle={`${t('stats.levels')} ${String(configIndex + 1).padStart(2, '0')} · ${formatLevelName(locale, config.name)}`}
          backLabel={t('app.dashboard')}
          onBack={() => void navigate({ to: '/' })}
          meta={
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.08] px-2.5 py-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="font-display text-[0.8125rem] font-medium tabular-nums text-primary">
                {timerLabel}
              </span>
            </div>
          }
        />

        {/* Progress bar */}
        <div className="mx-4 mt-3.5 h-1.5 overflow-hidden rounded-full bg-primary/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-chart-2 to-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <Confetti active={game.winner === 'player'} />

        <main className="flex-1 overflow-auto px-4 pt-3.5 pb-4">
          {/* Round + status */}
          <div className="flex items-start justify-between pt-1 pb-4">
            <div>
              <p
                className="eyebrow text-primary"
                style={{ fontSize: '0.5625rem' }}
              >
                ◆ {formatActor(locale, game.turn)}
              </p>
              <h2 className="font-display mt-1.5 text-[1.375rem] font-medium tracking-tight">
                {game.gameOver
                  ? `${formatActor(locale, game.winner ?? 'player')} ${t('game.wins')}`
                  : t('game.raceLine')}
              </h2>
            </div>
            <div className="text-right">
              <p className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                {t('game.target')}
              </p>
              <p className="font-display text-[1.625rem] font-medium leading-none tabular-nums text-primary">
                {game.currentPosition}
                <span className="text-base text-muted-foreground">
                  /{game.target}
                </span>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="eyebrow" style={{ fontSize: '0.5625rem' }}>
              {t('game.numbers')}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Step grid — big tap targets */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {sequence.map((step, index) => {
              const disabled =
                game.gameOver ||
                session.timedOut ||
                aiThinking ||
                !humanTurn ||
                !validMoves.includes(step)
              return (
                <button
                  key={`${step}-${index}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => void playMove(step)}
                  className="relative min-h-[5.75rem] rounded-2xl border border-border bg-card font-display text-3xl font-medium text-foreground transition-colors disabled:opacity-50"
                >
                  <span className="absolute top-2.5 left-3 font-sans text-[0.625rem] font-semibold tracking-wider text-muted-foreground uppercase">
                    {String.fromCharCode(65 + index)}
                  </span>
                  +{step}
                </button>
              )
            })}
          </div>

          {/* Score strip */}
          <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card">
            {[
              {
                k: t('game.target'),
                v: String(game.currentPosition),
                sub: `/ ${game.target}`,
                emphasize: true,
              },
              {
                k: t('profile.attempts'),
                v: String(playerTurns),
                sub: levelAttempts > 0 ? `· ${levelAttempts}` : '',
              },
              { k: t('home.streak'), v: String(turnsTaken), sub: '' },
            ].map((s, i) => (
              <div
                key={s.k}
                className="py-3 text-center"
                style={{
                  borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
                  padding: '0.75rem 0.625rem',
                }}
              >
                <p className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                  {s.k}
                </p>
                <p
                  className={`font-display mt-1 text-lg font-medium leading-none tabular-nums ${
                    s.emphasize ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {s.v}
                </p>
                {s.sub ? (
                  <p
                    className="mt-0.5 text-muted-foreground"
                    style={{ fontSize: '0.625rem' }}
                  >
                    {s.sub}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={resetGame}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background text-[0.8125rem] font-medium text-foreground"
            >
              ↺ {t('game.reset')}
            </button>
            <button
              type="button"
              onClick={() => session.setPaused(!session.paused)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background text-[0.8125rem] font-medium text-foreground"
            >
              {session.paused ? t('game.resume') : t('game.pause')}
            </button>
          </div>

          {saveStatus ? (
            <p className="mt-3 text-center text-[0.6875rem] text-muted-foreground">
              {saveStatus}
            </p>
          ) : null}
          {session.timedOut ? (
            <p className="mt-3 text-center text-[0.6875rem] font-medium text-destructive">
              {t('game.timedOut')}
            </p>
          ) : null}
          {aiThinking ? (
            <p className="mt-3 text-center text-[0.6875rem] text-muted-foreground">
              {t('game.aiThinking')}…
            </p>
          ) : null}
        </main>
      </div>
    </>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'

import { getDailyChallenge } from '@/daily/daily.functions'
import { gameModules, registry } from '@/games/registry'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [overview, dailyChallenge] = await Promise.all([
      getPlayerProfileOverview(),
      getDailyChallenge(),
    ])

    return {
      dailyChallenge,
      games: gameModules.map((module) => ({
        description: module.description,
        gameId: module.id,
        levelCount: module.levelCount,
        title: module.title,
        to: module.route,
      })),
      overview,
    }
  },
  component: Home,
})

function summarizeProgress(
  progressRows: PlayerProgressSummary[],
  gameId: string,
) {
  const rows = progressRows.filter((row) => row.gameId === gameId)
  const completed = rows.filter((row) => row.completedAt !== null).length
  const attempts = rows.reduce((total, row) => total + row.attempts, 0)
  const bestScore = rows.reduce(
    (currentBest, row) => Math.max(currentBest, row.bestScore),
    0,
  )

  return {
    attempts,
    bestScore,
    completed,
  }
}

function Home() {
  const { dailyChallenge, games, overview } = Route.useLoaderData()
  const progressRows = overview.progress as PlayerProgressSummary[]
  const completedCount = progressRows.filter(
    (row) => row.completedAt !== null,
  ).length
  const dailyTo = registry[dailyChallenge.gameId].route

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8 text-neutral-950">
      <header className="grid gap-6 border-b border-neutral-300 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-neutral-500">
            Math Games
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Practice Dashboard</h1>
          <p className="mt-3 max-w-2xl text-neutral-700">
            Choose a game, play today&apos;s challenge, and keep progress in the
            player profile.
          </p>
          <span hidden>D1-backed profile state</span>
        </div>
        <aside className="border border-neutral-300 px-4 py-3">
          <div className="text-sm font-semibold uppercase text-neutral-500">
            Player
          </div>
          <Link className="mt-1 block text-2xl font-semibold" to="/profile">
            {overview.profile.displayName}
          </Link>
        </aside>
      </header>

      <main className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-neutral-300 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-neutral-500">
                Today
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Daily Challenge</h2>
              <p className="mt-2 text-xl font-semibold">
                {dailyChallenge.title}
              </p>
              <p className="mt-2 text-neutral-700">
                {dailyChallenge.challengeDate} · {dailyChallenge.difficulty} ·{' '}
                {dailyChallenge.gameId}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                className="inline-flex border border-neutral-950 px-4 py-3 font-semibold text-neutral-950"
                to="/daily"
              >
                Play Today
              </Link>
              <Link
                className="inline-flex border border-neutral-950 bg-neutral-950 px-4 py-3 font-semibold text-white"
                search={{ level: dailyChallenge.levelId }}
                to={dailyTo}
              >
                Start Level
              </Link>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="border-t border-neutral-200 pt-3">
              <dt className="text-neutral-600">Level</dt>
              <dd className="mt-1 font-semibold">{dailyChallenge.levelId}</dd>
            </div>
            <div className="border-t border-neutral-200 pt-3">
              <dt className="text-neutral-600">Seed</dt>
              <dd className="mt-1 font-mono text-xs">{dailyChallenge.seed}</dd>
            </div>
            <div className="border-t border-neutral-200 pt-3">
              <dt className="text-neutral-600">Profile</dt>
              <dd className="mt-1 font-semibold">Saved progress</dd>
            </div>
          </dl>
        </section>

        <section className="grid grid-cols-3 border border-neutral-300 text-center">
          <div className="border-r border-neutral-300 p-5">
            <div className="text-3xl font-semibold">{completedCount}</div>
            <div className="mt-2 text-sm text-neutral-600">Completed</div>
          </div>
          <div className="border-r border-neutral-300 p-5">
            <div className="text-3xl font-semibold">{progressRows.length}</div>
            <div className="mt-2 text-sm text-neutral-600">Progress Rows</div>
          </div>
          <div className="p-5">
            <div className="text-3xl font-semibold">
              {overview.achievements.length}
            </div>
            <div className="mt-2 text-sm text-neutral-600">Achievements</div>
          </div>
        </section>
      </main>

      <section className="grid gap-5 md:grid-cols-3">
        {games.map((game) => {
          const progress = summarizeProgress(progressRows, game.gameId)

          return (
            <article
              className="border border-neutral-300 p-5"
              key={game.gameId}
            >
              <div className="flex min-h-64 flex-col justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-semibold">{game.title}</h2>
                  <p className="mt-2 text-neutral-700">{game.description}</p>
                  <dl className="mt-5 grid gap-2 text-sm">
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <dt className="text-neutral-600">Levels</dt>
                      <dd className="font-medium">{game.levelCount}</dd>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <dt className="text-neutral-600">Completed</dt>
                      <dd className="font-medium">{progress.completed}</dd>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <dt className="text-neutral-600">Best</dt>
                      <dd className="font-medium">{progress.bestScore}</dd>
                    </div>
                  </dl>
                </div>
                <Link
                  className="inline-flex w-fit border border-neutral-950 px-4 py-3 font-semibold text-neutral-950"
                  search={{ level: undefined }}
                  to={game.to}
                >
                  Play
                </Link>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

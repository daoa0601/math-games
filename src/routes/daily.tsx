import { createFileRoute, Link } from '@tanstack/react-router'

import { getDailyChallenge } from '@/daily/daily.functions'
import { registry } from '@/games/registry'

export const Route = createFileRoute('/daily')({
  loader: () => getDailyChallenge(),
  component: DailyRoute,
})

function DailyRoute() {
  const challenge = Route.useLoaderData()
  const playSearch = { level: challenge.levelId }
  const playRoute = registry[challenge.gameId].route

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-8 text-neutral-950">
      <header className="border-b border-neutral-300 pb-6">
        <Link
          className="text-sm text-neutral-600 hover:text-neutral-950"
          to="/"
        >
          Math Games
        </Link>
        <h1 className="mt-3 text-4xl font-semibold">Daily Challenge</h1>
        <p className="mt-2 max-w-2xl text-neutral-700">
          A fresh puzzle selected for today, linked directly to the playable
          game route.
        </p>
        <span hidden>D1-backed daily challenge row</span>
      </header>

      <section className="grid gap-6 border border-neutral-300 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-neutral-500">
            {challenge.challengeDate}
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{challenge.title}</h2>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between gap-6 border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Game</dt>
              <dd className="font-medium">{challenge.gameId}</dd>
            </div>
            <div className="flex justify-between gap-6 border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Level</dt>
              <dd className="font-medium">{challenge.levelId}</dd>
            </div>
            <div className="flex justify-between gap-6 border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Difficulty</dt>
              <dd className="font-medium capitalize">{challenge.difficulty}</dd>
            </div>
            <div className="flex justify-between gap-6 border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Seed</dt>
              <dd className="font-mono text-xs">{challenge.seed}</dd>
            </div>
          </dl>
        </div>

        <Link
          className="inline-flex border border-neutral-950 px-4 py-3 font-semibold text-neutral-950"
          search={playSearch}
          to={playRoute}
        >
          Play Today
        </Link>
      </section>
    </main>
  )
}

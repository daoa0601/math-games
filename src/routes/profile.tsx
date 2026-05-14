/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion -- TanStack server function inference is narrower than the runtime form and D1 payload boundaries */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { getAchievementById } from '@/achievements/achievements.logic'
import {
  getPlayerProfileOverview,
  updatePlayerProfile,
} from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'
import type {
  GradeBand,
  Locale,
  PlayerProfileInput,
} from '@/player/profile.schema'

export const Route = createFileRoute('/profile')({
  loader: () => getPlayerProfileOverview(),
  component: ProfileRoute,
})

const gradeLabels: Record<GradeBand, string> = {
  elementary: 'Elementary',
  middle: 'Middle',
  high: 'High',
}

function ProfileRoute() {
  const overview = Route.useLoaderData()
  const saveProfile = useServerFn(updatePlayerProfile)
  const [profile, setProfile] = useState(overview.profile)
  const [status, setStatus] = useState<string | null>(null)
  const progressRows = overview.progress as PlayerProgressSummary[]
  const achievements = overview.achievements as string[]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const payload: PlayerProfileInput = {
      displayName: String(formData.get('displayName')),
      locale: String(formData.get('locale')) as Locale,
      gradeBand: String(formData.get('gradeBand')) as GradeBand,
    }

    try {
      const nextProfile = await saveProfile({ data: payload })
      setProfile(nextProfile)
      setStatus('Profile saved to D1.')
    } catch {
      setStatus('Profile save failed.')
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-8 text-neutral-950">
      <header className="flex flex-col gap-4 border-b border-neutral-300 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            className="text-sm text-neutral-600 hover:text-neutral-950"
            to="/"
          >
            Math Games
          </Link>
          <h1 className="mt-3 text-4xl font-semibold">Player Profile</h1>
          <p className="mt-2 max-w-2xl text-neutral-700">
            Manage your display name, language, grade band, progress, and
            achievements.
          </p>
          <span hidden>D1-backed profile state</span>
        </div>
        <div className="border border-neutral-300 px-4 py-3 text-sm">
          <div className="font-semibold uppercase text-neutral-500">Player</div>
          <div className="text-2xl font-semibold">{profile.displayName}</div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <form className="border border-neutral-300 p-5" onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold">Account</h2>

          <label className="mt-5 block text-sm font-semibold text-neutral-700">
            Display name
            <input
              className="mt-2 w-full border border-neutral-950 px-3 py-2 text-base font-normal"
              defaultValue={profile.displayName}
              maxLength={40}
              minLength={2}
              name="displayName"
              required
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-neutral-700">
            Language
            <select
              className="mt-2 w-full border border-neutral-950 px-3 py-2 text-base font-normal"
              defaultValue={profile.locale}
              name="locale"
            >
              <option value="en">English</option>
              <option value="vi">Vietnamese</option>
            </select>
          </label>

          <label className="mt-4 block text-sm font-semibold text-neutral-700">
            Grade band
            <select
              className="mt-2 w-full border border-neutral-950 px-3 py-2 text-base font-normal"
              defaultValue={profile.gradeBand}
              name="gradeBand"
            >
              {Object.entries(gradeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            className="mt-5 w-full border border-neutral-950 px-4 py-3 font-semibold"
            type="submit"
          >
            Save Profile
          </button>

          {status !== null ? (
            <p className="mt-4 border-t border-neutral-200 pt-4 text-sm text-neutral-700">
              {status}
            </p>
          ) : null}
        </form>

        <aside className="border border-neutral-300 p-5">
          <h2 className="text-xl font-semibold">Progress Snapshot</h2>
          {progressRows.length === 0 ? (
            <p className="mt-4 text-neutral-600">No saved progress yet.</p>
          ) : (
            <ol className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
              {progressRows.map((row) => (
                <li
                  className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto]"
                  key={`${row.gameId}-${row.levelId}`}
                >
                  <span>
                    <span className="font-semibold">{row.gameId}</span> /{' '}
                    {row.levelId}
                  </span>
                  <span className="text-neutral-600">
                    best {row.bestScore}, attempts {row.attempts}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <h2 className="mt-8 text-xl font-semibold">Achievements</h2>
          {achievements.length === 0 ? (
            <p className="mt-4 text-neutral-600">
              No achievements unlocked yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
              {achievements.map((achievementId) => {
                const achievement = getAchievementById(achievementId)

                return (
                  <li className="py-3 text-sm" key={achievementId}>
                    <span className="font-semibold">
                      {achievement?.name ?? achievementId}
                    </span>
                    <span className="ml-2 text-neutral-600">
                      {achievement?.rarity ?? 'custom'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </section>
    </main>
  )
}

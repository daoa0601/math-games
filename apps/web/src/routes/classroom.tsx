import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { LanguageToggle, ThemeToggle, Wordmark } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@math-games/ui'
import { Progress } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { GAME_MODULES } from '@/games/registry'
import {
  createAssignment,
  createClassroom,
  getClassroomAssignments,
  getClassroomMembers,
  getMyClassrooms,
  joinClassroom,
} from '@/classroom/classroom.functions'
import { runServerAction } from '@/routes/-server-action-result'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'
import type {
  AssignmentWithProgress,
  MemberWithProgress,
} from '@math-games/effect-classroom'

export const Route = createFileRoute('/classroom')({
  loader: () => getMyClassrooms(),
  component: ClassroomRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})

function ClassroomRoute() {
  const t = useT()
  const classrooms = Route.useLoaderData()
  const [status, setStatus] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const createFn = useServerFn(createClassroom)
  const joinFn = useServerFn(joinClassroom)

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), 5000)
    return () => clearTimeout(timer)
  }, [status])

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    if (!name) return

    const res = await runServerAction(
      () => createFn({ data: { name } }),
      'Failed to create classroom.',
    )
    if (res.ok) {
      setStatus(`Created "${res.value.name}" — code: ${res.value.joinCode}`)
    } else {
      setStatus(res.message)
    }
  }

  async function handleJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const joinCode = form.get('joinCode') as string
    if (!joinCode) return

    const res = await runServerAction(
      () => joinFn({ data: { joinCode } }),
      'Failed to join classroom.',
    )
    if (res.ok) {
      setStatus('Joined classroom.')
    } else {
      setStatus(res.message)
    }
  }

  const selected = classrooms.find((c) => c.id === selectedId)

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 border-b border-border/60 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="/"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Wordmark compact label={t('app.title')} />
          </a>
          <span aria-hidden className="text-border">
            /
          </span>
          {selected ? (
            <>
              <button
                onClick={() => setSelectedId(null)}
                className="font-display text-base font-medium tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                type="button"
              >
                {t('classroom.title')}
              </button>
              <span aria-hidden className="text-border">
                /
              </span>
              <h1 className="font-display truncate text-base font-medium tracking-tight md:text-lg">
                {selected.name}
              </h1>
            </>
          ) : (
            <h1 className="font-display truncate text-base font-medium tracking-tight md:text-lg">
              {t('classroom.title')}
            </h1>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {status && (
        <p className="rounded-md border border-border bg-muted/50 px-4 py-2 text-sm">
          {status}
        </p>
      )}

      {selected ? (
        <ClassroomDetail
          classroomId={selected.id}
          role={selected.role}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('classroom.create')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="flex flex-col gap-3">
                  <input
                    name="name"
                    placeholder={t('classroom.name')}
                    required
                    className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                  <Button type="submit">{t('classroom.create')}</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('classroom.join')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="flex flex-col gap-3">
                  <input
                    name="joinCode"
                    placeholder={t('classroom.joinCode')}
                    required
                    className="rounded-md border border-input bg-background px-3 py-2 font-mono uppercase tracking-wider text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                  <Button type="submit">{t('classroom.join')}</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {t('classroom.myClassrooms')}
            </h2>
            {classrooms.length === 0 ? (
              <p className="text-muted-foreground">
                {t('classroom.noClassrooms')}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {classrooms.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    type="button"
                    className="rounded-lg border border-border px-5 py-4 text-left transition-colors hover:border-primary"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display font-medium tracking-tight">
                        {c.name}
                      </p>
                      <Badge
                        variant={c.role === 'teacher' ? 'default' : 'outline'}
                      >
                        {t(
                          c.role === 'teacher'
                            ? 'classroom.role.teacher'
                            : 'classroom.role.student',
                        )}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.memberCount} {t('classroom.memberCount')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

function ClassroomDetail({
  classroomId,
  role,
  onBack,
}: {
  classroomId: string
  role: string
  onBack: () => void
}) {
  const t = useT()
  const membersFn = useServerFn(getClassroomMembers)
  const assignmentsFn = useServerFn(getClassroomAssignments)
  const createAssignmentFn = useServerFn(createAssignment)

  const [members, setMembers] = useState<MemberWithProgress[] | null>(null)
  const [assignments, setAssignments] = useState<
    AssignmentWithProgress[] | null
  >(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    void loadData()
  }, [classroomId])

  async function loadData() {
    const [m, a] = await Promise.all([
      runServerAction(
        () => membersFn({ data: { classroomId } }),
        'Failed to load members.',
      ),
      runServerAction(
        () => assignmentsFn({ data: { classroomId } }),
        'Failed to load assignments.',
      ),
    ])
    if (m.ok) setMembers(m.value)
    if (a.ok) setAssignments(a.value)
  }

  async function handleCreateAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const gameId = form.get('gameId') as string
    const dueDate = (form.get('dueDate') as string) || undefined
    if (!title || !gameId) return

    const res = await runServerAction(
      () =>
        createAssignmentFn({
          data: { classroomId, title, gameId, levelIds: [], dueDate },
        }),
      'Failed to create assignment.',
    )
    if (res.ok) {
      setStatus(`Created "${res.value.title}"`)
      void loadData()
    } else {
      setStatus(res.message)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← {t('classroom.back')}
      </Button>

      {status && (
        <p className="rounded-md border border-border bg-muted/50 px-4 py-2 text-sm">
          {status}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t('classroom.members')}{' '}
              {members && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({members.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="space-y-3">
                {members.map((m) => (
                  <div
                    key={m.playerId}
                    className="flex items-center justify-between rounded-md border border-border/60 p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {m.displayName || m.playerId.slice(0, 12)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.completedLevels} {t('classroom.levelsCompleted')} ·{' '}
                        {m.totalAttempts} {t('classroom.totalAttempts')}
                      </p>
                    </div>
                    <Badge
                      variant={m.role === 'teacher' ? 'default' : 'outline'}
                    >
                      {t(
                        m.role === 'teacher'
                          ? 'classroom.role.teacher'
                          : 'classroom.role.student',
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('classroom.assignments')}</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments === null ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('classroom.noAssignments')}
                </p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-md border border-border/60 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{a.title}</p>
                        <Badge variant="outline">{a.gameId}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress
                          value={
                            a.totalMembers > 0
                              ? (a.completedByCount / a.totalMembers) * 100
                              : 0
                          }
                          className="h-2 flex-1"
                        />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {a.completedByCount}/{a.totalMembers}{' '}
                          {t('classroom.completed')}
                        </span>
                      </div>
                      {a.dueDate && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('classroom.dueDate')}: {a.dueDate}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {role === 'teacher' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('classroom.createAssignment')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateAssignment}
                  className="flex flex-col gap-3"
                >
                  <input
                    name="title"
                    placeholder={t('classroom.assignmentTitle')}
                    required
                    className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                  <select
                    name="gameId"
                    required
                    className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  >
                    {GAME_MODULES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                  <input
                    name="dueDate"
                    type="date"
                    className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                  <Button type="submit">
                    {t('classroom.createAssignment')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

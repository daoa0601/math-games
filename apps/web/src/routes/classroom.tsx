import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { LanguageToggle } from '@math-games/ui'
import { ThemeToggle } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@math-games/ui'
import { useT } from '@math-games/ui'
import {
  createClassroom,
  getMyClassrooms,
  joinClassroom,
} from '@/classroom/classroom.functions'
import { runServerAction } from '@/routes/-server-action-result'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

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

  const createFn = useServerFn(createClassroom)
  const joinFn = useServerFn(joinClassroom)

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
      setStatus(
        `Created classroom "${res.value.name}" — code: ${res.value.joinCode}`,
      )
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

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <h1 className="text-xl font-bold tracking-tight">Classrooms</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {status && (
        <p className="rounded-md bg-muted px-4 py-2 text-sm">{status}</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Classroom</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                name="name"
                placeholder="Classroom name"
                required
                className="rounded-md border border-border bg-background px-3 py-2"
              />
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join Classroom</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                name="joinCode"
                placeholder="Enter join code"
                required
                className="rounded-md border border-border bg-background px-3 py-2 font-mono uppercase tracking-wider"
              />
              <Button type="submit">Join</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">My Classrooms</h2>
        {classrooms.length === 0 ? (
          <p className="text-muted-foreground">
            No classrooms yet. Create one or join with a code.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classrooms.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.memberCount} members
                    </p>
                  </div>
                  <Badge variant={c.role === 'teacher' ? 'default' : 'outline'}>
                    {c.role}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

import { Skeleton } from '@math-games/ui'

export function RoutePending() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
    </main>
  )
}

export function GameRoutePending() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
      <div className="flex flex-col gap-6 lg:flex-row">
        <Skeleton className="h-80 flex-1 rounded-xl" />
        <div className="flex w-full flex-col gap-4 lg:w-72">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
    </main>
  )
}

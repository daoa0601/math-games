import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Button } from '@math-games/ui'
import { useT } from '@math-games/ui'

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  const t = useT()

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-semibold">{t('error.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('error.body')}</p>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="mt-4 max-w-full overflow-auto rounded-md bg-muted p-3 text-left text-xs">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>{t('error.retry')}</Button>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {t('app.dashboard')}
        </Link>
      </div>
    </main>
  )
}

import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Component, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { formatGameTitle } from '@/i18n-format'
import { translations } from '@/i18n-translations'
import { LocaleProvider, useLocale } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { GAME_MODULES } from '@/games/registry'
import geistCss from '@fontsource-variable/geist/index.css?url'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Math Games',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300..700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: geistCss,
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: StandaloneNotFound,
  shellComponent: RootDocument,
})

function StandaloneNotFound() {
  const t = useT()
  const { locale } = useLocale()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t('app.notFoundEyebrow')}
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{t('app.notFoundTitle')}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        {t('app.notFoundBody')}
      </p>
      <nav className="mt-8 flex flex-wrap gap-3" aria-label={t('game.levels')}>
        <a
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          href="/"
        >
          {t('app.dashboard')}
        </a>
        {GAME_MODULES.map((m) => (
          <a
            key={m.id}
            className="rounded-lg border border-border px-4 py-2"
            href={m.route}
          >
            {formatGameTitle(locale, m.id)}
          </a>
        ))}
      </nav>
    </main>
  )
}

interface ErrorBoundaryState {
  error: Error | null
}

class RootErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack)
  }

  override render() {
    if (this.state.error) {
      return (
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
          <h1 className="text-4xl font-semibold">Something went wrong</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            className="mt-8 w-fit rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </main>
      )
    }
    return this.props.children
  }
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('mg-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <LocaleProvider translations={translations}>
          <RootErrorBoundary>
            <HydrationMarker />
            {children}
          </RootErrorBoundary>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          <Scripts />
        </LocaleProvider>
      </body>
    </html>
  )
}

function HydrationMarker() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return (
    <span data-testid="app-hydrated" hidden>
      {hydrated ? 'hydrated' : 'hydrating'}
    </span>
  )
}

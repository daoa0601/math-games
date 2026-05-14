import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { formatGameTitle } from '@/components/i18n-format'
import { LocaleProvider, useLocale } from '@/components/locale-context'
import { useT } from '@/components/use-t'
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
        <a
          className="rounded-lg border border-border px-4 py-2"
          href="/games/magic-graph"
        >
          {formatGameTitle(locale, 'magic-graph')}
        </a>
        <a
          className="rounded-lg border border-border px-4 py-2"
          href="/games/sequence-race"
        >
          {formatGameTitle(locale, 'sequence-race')}
        </a>
        <a
          className="rounded-lg border border-border px-4 py-2"
          href="/games/shape-architect"
        >
          {formatGameTitle(locale, 'shape-architect')}
        </a>
      </nav>
    </main>
  )
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
        <LocaleProvider>
          <HydrationMarker />
          {children}
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

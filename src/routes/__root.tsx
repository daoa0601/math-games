import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { LocaleProvider } from '@/components/locale-context'
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
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Page not found
      </p>
      <h1 className="mt-3 text-4xl font-semibold">
        This page is not available.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Use the dashboard or game routes.
      </p>
      <nav className="mt-8 flex flex-wrap gap-3" aria-label="Game routes">
        <a
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          href="/"
        >
          Dashboard
        </a>
        <a
          className="rounded-lg border border-border px-4 py-2"
          href="/games/magic-graph"
        >
          Magic Graph
        </a>
        <a
          className="rounded-lg border border-border px-4 py-2"
          href="/games/sequence-race"
        >
          Sequence Race
        </a>
        <a
          className="rounded-lg border border-border px-4 py-2"
          href="/games/shape-architect"
        >
          Shape Architect
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

import { createRootRoute } from '@tanstack/react-router'

import { RootDocument, StandaloneNotFound } from './-root-components'
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
        href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap',
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

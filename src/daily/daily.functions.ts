import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'

import { AppLayer } from '@/services'

import { loadDailyChallenge } from './daily.server'

export const getDailyChallenge = createServerFn({ method: 'GET' }).handler(
  () => {
    setResponseHeader('cache-control', 'no-store')

    return loadDailyChallenge().pipe(
      Effect.provide(AppLayer),
      Effect.runPromise,
    )
  },
)

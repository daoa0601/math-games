import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'

import { createUpdateProfilePipeline } from '@/games/server-handlers'
import { AppLayer } from '@/services'

import { loadPlayerProfileOverview } from './profile.server'
import { validatePlayerProfileInput } from './profile.validation'

export const getPlayerProfileOverview = createServerFn({
  method: 'GET',
}).handler(() => {
  setResponseHeader('cache-control', 'no-store')

  return loadPlayerProfileOverview().pipe(
    Effect.provide(AppLayer),
    Effect.runPromise,
  )
})

export const updatePlayerProfile = createServerFn({ method: 'POST' })
  .inputValidator(validatePlayerProfileInput)
  .handler(({ data }) =>
    createUpdateProfilePipeline(data).pipe(
      Effect.provide(AppLayer),
      Effect.runPromise,
    ),
  )

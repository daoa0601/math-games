import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'

import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
  validateGameProgressRequest,
} from '@/games/server-handlers'
import { AppLayer } from '@/services'

import { sequenceRaceModule } from './module'

export const getSequenceRaceLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(sequenceRaceModule),
)

export const recordSequenceRaceProgress = createServerFn({ method: 'POST' })
  .inputValidator(validateGameProgressRequest)
  .handler(({ data }) =>
    createRecordProgressPipeline(sequenceRaceModule, data).pipe(
      Effect.provide(AppLayer),
      Effect.runPromise,
    ),
  )

import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'

import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
  validateGameProgressRequest,
} from '@/games/server-handlers'
import { AppLayer } from '@/services'

import { magicGraphModule } from './module'

export const getMagicGraphLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(magicGraphModule),
)

export const recordMagicGraphProgress = createServerFn({ method: 'POST' })
  .inputValidator(validateGameProgressRequest)
  .handler(({ data }) =>
    createRecordProgressPipeline(magicGraphModule, data).pipe(
      Effect.provide(AppLayer),
      Effect.runPromise,
    ),
  )

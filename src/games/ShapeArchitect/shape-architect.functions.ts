import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'

import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
  validateGameProgressRequest,
} from '@/games/server-handlers'
import { AppLayer } from '@/services'

import { shapeArchitectModule } from './module'

export const getShapeArchitectLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(shapeArchitectModule),
)

export const recordShapeArchitectProgress = createServerFn({ method: 'POST' })
  .inputValidator(validateGameProgressRequest)
  .handler(({ data }) =>
    createRecordProgressPipeline(shapeArchitectModule, data).pipe(
      Effect.provide(AppLayer),
      Effect.runPromise,
    ),
  )

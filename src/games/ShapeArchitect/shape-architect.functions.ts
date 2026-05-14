import { createServerFn } from '@tanstack/react-start'

import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services'

import { shapeArchitectModule } from './module'

export const getShapeArchitectLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(shapeArchitectModule),
)

export const recordShapeArchitectProgress = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(shapeArchitectModule, data)),
  )

import { createServerFn } from '@tanstack/react-start'

import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services'

import { shapeArchitectModule } from './module'
import { createValidateMoveEffect } from './shape-architect.server'

export const getShapeArchitectLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(shapeArchitectModule),
)

export const recordShapeArchitectProgress = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(shapeArchitectModule, data)),
  )

export const validateShapeArchitectMove = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(({ data }) => runServerEffect(createValidateMoveEffect(data)))

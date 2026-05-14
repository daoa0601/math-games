import { createServerFn } from '@tanstack/react-start'

import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services'

import { sequenceRaceModule } from './module'

export const getSequenceRaceLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(sequenceRaceModule),
)

export const recordSequenceRaceProgress = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(sequenceRaceModule, data)),
  )

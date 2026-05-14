import { createServerFn } from '@tanstack/react-start'

import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services'

import { magicGraphModule } from './module'

export const getMagicGraphLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(magicGraphModule),
)

export const recordMagicGraphProgress = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(magicGraphModule, data)),
  )

import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'

import { GameProgressRequest } from '@/games/game-progress.schema'
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
  .inputValidator(Schema.decodeUnknownSync(GameProgressRequest))
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(magicGraphModule, data)),
  )

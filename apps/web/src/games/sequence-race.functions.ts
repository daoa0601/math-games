import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'

import { GameProgressRequest } from '@/games/game-progress.schema'
import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@math-games/services'

import { sequenceRaceModule } from '@math-games/game-sequence-race'

export const getSequenceRaceLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(sequenceRaceModule),
)

export const recordSequenceRaceProgress = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(GameProgressRequest))
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(sequenceRaceModule, data)),
  )

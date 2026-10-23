import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'

import { GameProgressRequest } from '@math-games/core'
import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services/run-server-effect'

import { sequenceRaceModule } from '@math-games/game-sequence-race'

export const getSequenceRaceLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(sequenceRaceModule),
)

export const recordSequenceRaceProgress = createServerFn({ method: 'POST' })
  .validator(Schema.decodeUnknownSync(GameProgressRequest))
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(sequenceRaceModule, data)),
  )

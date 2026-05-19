import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'

import { GameProgressRequest } from '@/games/game-progress.schema'
import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services/run-server-effect'

import { fractionBuilderModule } from '@math-games/game-fraction-builder'

export const getFractionBuilderCatalog = createServerFn({
  method: 'GET',
}).handler(createGetCatalogHandler(fractionBuilderModule))

export const recordFractionBuilderProgress = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(GameProgressRequest))
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(fractionBuilderModule, data)),
  )

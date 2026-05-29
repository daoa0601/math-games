import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'

import { GameProgressRequest } from '@math-games/core'
import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services/run-server-effect'

import { patternDetectiveModule } from '@math-games/game-pattern-detective'

export const getPatternDetectiveCatalog = createServerFn({
  method: 'GET',
}).handler(createGetCatalogHandler(patternDetectiveModule))

export const recordPatternDetectiveProgress = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(GameProgressRequest))
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(patternDetectiveModule, data)),
  )

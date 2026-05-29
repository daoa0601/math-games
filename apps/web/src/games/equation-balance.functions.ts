import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'

import { GameProgressRequest } from '@math-games/core'
import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services/run-server-effect'

import { equationBalanceModule } from '@math-games/game-equation-balance'

export const getEquationBalanceCatalog = createServerFn({
  method: 'GET',
}).handler(createGetCatalogHandler(equationBalanceModule))

export const recordEquationBalanceProgress = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(GameProgressRequest))
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(equationBalanceModule, data)),
  )

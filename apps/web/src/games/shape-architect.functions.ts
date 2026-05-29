import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'

import { GameProgressRequest } from '@/games/game-progress.schema'
import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services/run-server-effect'

import { shapeArchitectModule } from '@math-games/game-shape-architect'
import {
  ShapeArchitectMoveRequest,
  ShapeArchitectSolutionRequest,
} from './shape-architect.schema'
import {
  createSolveLevelEffect,
  createValidateMoveEffect,
} from './shape-architect.server'

export const getShapeArchitectLevel = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(shapeArchitectModule),
)

export const recordShapeArchitectProgress = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(GameProgressRequest))
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(shapeArchitectModule, data)),
  )

export const validateShapeArchitectMove = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(ShapeArchitectMoveRequest))
  .handler(({ data }) => runServerEffect(createValidateMoveEffect(data)))

export const getShapeArchitectSolution = createServerFn({ method: 'GET' })
  .inputValidator(Schema.decodeUnknownSync(ShapeArchitectSolutionRequest))
  .handler(({ data }) => runServerEffect(createSolveLevelEffect(data)))

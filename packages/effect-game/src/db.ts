import { Context, Effect, Layer } from 'effect'

import { createDb } from '@math-games/db'
import type { AppDatabase } from '@math-games/db'

import { WorkerEnvService } from '@math-games/effect-infra'

export interface DbShape {
  readonly db: AppDatabase
}

export const DbService = Context.Service<DbShape>('DbService')

export const DbServiceLive = Layer.effect(
  DbService,
  Effect.map(WorkerEnvService, (env) => ({ db: createDb(env.getD1()) })),
)

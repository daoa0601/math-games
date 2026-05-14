import { Context, Effect, Layer } from 'effect'

import { createDb } from '@/db'
import type { AppDatabase } from '@/db'

import { WorkerEnvService } from './worker-env'

export interface DbShape {
  readonly db: AppDatabase
}

export const DbService = Context.Service<DbShape>('DbService')

export const DbServiceLive = Layer.effect(
  DbService,
  Effect.map(WorkerEnvService, (env) => ({ db: createDb(env.getD1()) })),
)

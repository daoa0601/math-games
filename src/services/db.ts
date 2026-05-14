import { Context, Layer } from 'effect'
import { env } from 'cloudflare:workers'

import { createDb } from '@/db'
import type { AppDatabase } from '@/db'

export interface DbShape {
  readonly db: AppDatabase
}

export const DbService = Context.Service<DbShape>('DbService')

export const DbServiceLive = Layer.sync(DbService, () => ({
  db: createDb(env.DB),
}))

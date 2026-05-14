import { Context, Layer } from 'effect'

export interface WorkerEnvShape {
  readonly getD1: () => D1Database
}

export const WorkerEnvService =
  Context.Service<WorkerEnvShape>('WorkerEnvService')

export const WorkerEnvServiceLive = Layer.sync(WorkerEnvService, () => {
  const { env } = require('cloudflare:workers') as {
    env: { DB: D1Database }
  }
  return { getD1: () => env.DB }
})

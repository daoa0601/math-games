import { Context, Layer } from 'effect'
import { env } from 'cloudflare:workers'

export interface WorkerEnvShape {
  readonly getD1: () => D1Database
}

export const WorkerEnvService =
  Context.Service<WorkerEnvShape>('WorkerEnvService')

export const WorkerEnvServiceLive = Layer.sync(WorkerEnvService, () => {
  return { getD1: () => env.DB }
})

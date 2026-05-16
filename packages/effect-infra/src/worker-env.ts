import { Context, Layer } from 'effect'
import { env } from 'cloudflare:workers'

export interface WorkerEnvShape {
  readonly getD1: () => D1Database
  readonly getKV: () => KVNamespace
  readonly getAnalytics: () => AnalyticsEngineDataset
  readonly getR2: () => R2Bucket
  readonly getTurnstileSecret: () => string | undefined
}

export const WorkerEnvService =
  Context.Service<WorkerEnvShape>('WorkerEnvService')

export const WorkerEnvServiceLive = Layer.sync(WorkerEnvService, () => {
  const e = env as unknown as {
    DB: D1Database
    CACHE: KVNamespace
    ANALYTICS: AnalyticsEngineDataset
    R2_ASSETS: R2Bucket
    TURNSTILE_SECRET_KEY?: string
  }

  return {
    getD1: () => e.DB,
    getKV: () => e.CACHE,
    getAnalytics: () => e.ANALYTICS,
    getR2: () => e.R2_ASSETS,
    getTurnstileSecret: () => e.TURNSTILE_SECRET_KEY,
  }
})

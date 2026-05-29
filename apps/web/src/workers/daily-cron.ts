import { lt } from '@math-games/db'
import { drizzle } from 'drizzle-orm/d1'

import { schema as dbSchema } from '@math-games/db'
import { forgeShapeArchitectSolutions } from '../games/shape-architect-solution-forge'

interface ServiceBinding {
  fetch(input: string, init?: { method?: string }): Promise<unknown>
}

interface Env {
  DB: D1Database
  CACHE: KVNamespace
  LEVEL_FORGE: ServiceBinding
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const RETENTION_DAYS = 30

// The per-player daily is planned lazily on first load and pinned in
// player_daily_selections (it can't be pre-generated for an unbounded, evolving
// player set), so the cron only prunes old pinned selections for retention.
async function purgeOldSelections(env: Env) {
  const db = drizzle(env.DB)
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS)
  const cutoffKey = dateKey(cutoff)

  await db
    .delete(dbSchema.playerDailySelections)
    .where(lt(dbSchema.playerDailySelections.challengeDate, cutoffKey))
}

async function pretsolveShapeArchitect(env: Env) {
  await forgeShapeArchitectSolutions({
    get: (key) => env.CACHE.get(key, 'text'),
    put: (key, value, options) => env.CACHE.put(key, value, options),
  })
}

// Kick the durable level-forge workflow to pre-warm the larger practice pool.
// Best-effort: a workflow hiccup must not break the pre-solve above.
async function triggerLevelForge(env: Env) {
  try {
    await env.LEVEL_FORGE.fetch('https://level-forge/start', {
      method: 'POST',
    })
  } catch {
    // ignore — the catalog is already warmed and the pool retries tomorrow
  }
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ) {
    await pretsolveShapeArchitect(env)
    await triggerLevelForge(env)
    await purgeOldSelections(env)
  },
} satisfies ExportedHandler<Env>

import { eq, lt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

import * as dbSchema from '../db/schema'
import { planDailyChallenge } from '../daily/daily.logic'

interface Env {
  DB: D1Database
  CACHE: KVNamespace
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function tomorrowDateKey(): string {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return dateKey(tomorrow)
}

function todayDateKey(): string {
  return dateKey(new Date())
}

const DAILY_CACHE_TTL = 86400
const RETENTION_DAYS = 30

async function pregenerate(env: Env) {
  const db = drizzle(env.DB)
  const keys = [todayDateKey(), tomorrowDateKey()]

  for (const dk of keys) {
    const cacheKey = `daily:${dk}`

    const cached = await env.CACHE.get(cacheKey, 'text')
    if (cached) continue

    const existing = await db
      .select()
      .from(dbSchema.dailyChallenges)
      .where(eq(dbSchema.dailyChallenges.challengeDate, dk))
      .limit(1)

    if (existing.length > 0) {
      const row = existing[0]
      const record = {
        ...JSON.parse(row.configJson),
        challengeDate: row.challengeDate,
        seed: row.seed,
      }
      await env.CACHE.put(cacheKey, JSON.stringify(record), {
        expirationTtl: DAILY_CACHE_TTL,
      })
      continue
    }

    const planned = await planDailyChallenge(dk)

    await db
      .insert(dbSchema.dailyChallenges)
      .values({
        challengeDate: planned.challengeDate,
        gameId: planned.gameId,
        seed: planned.seed,
        configJson: planned.configJson,
      })
      .onConflictDoNothing()

    const record = {
      ...JSON.parse(planned.configJson),
      challengeDate: planned.challengeDate,
      seed: planned.seed,
    }
    await env.CACHE.put(cacheKey, JSON.stringify(record), {
      expirationTtl: DAILY_CACHE_TTL,
    })
  }
}

async function purgeOldChallenges(env: Env) {
  const db = drizzle(env.DB)
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS)
  const cutoffKey = dateKey(cutoff)

  await db
    .delete(dbSchema.dailyChallenges)
    .where(lt(dbSchema.dailyChallenges.challengeDate, cutoffKey))
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ) {
    await pregenerate(env)
    await purgeOldChallenges(env)
  },
} satisfies ExportedHandler<Env>

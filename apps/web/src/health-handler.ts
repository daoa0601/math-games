// Lightweight /health handler wired into the worker entry.
//
// Returns a JSON snapshot of D1 reachability + latency WITHOUT going through
// the TanStack Start SSR pipeline (which is heavier than a health probe
// needs to be). The full Effect-based HealthService exists for the admin
// dashboard; this is the operational uptime probe.

import { env } from 'cloudflare:workers'

interface HealthResponse {
  status: 'ok' | 'down'
  checkedAt: string
  dbLatencyMs?: number
  dbMarker: string
}

export async function handleHealthRequest(): Promise<Response> {
  const startedAt = performance.now()
  let body: HealthResponse

  // The generated Worker env types live in worker-configuration.d.ts, but the
  // `cloudflare:workers` `env` import is typed loosely here. Cast once.
  const workerEnv = env as unknown as { DB: D1Database }

  try {
    const result = await workerEnv.DB.prepare(
      "SELECT 'd1-alive' AS marker, unixepoch() AS now",
    ).first<{ marker?: string }>()

    body = {
      status: 'ok',
      checkedAt: new Date().toISOString(),
      dbLatencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      dbMarker: result?.marker ?? 'd1-alive',
    }
  } catch {
    body = {
      status: 'down',
      checkedAt: new Date().toISOString(),
      dbMarker: 'd1-unreachable',
    }
  }

  return new Response(JSON.stringify(body), {
    status: body.status === 'ok' ? 200 : 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-mg-health': body.status,
    },
  })
}

export function isHealthRequest(request: Request): boolean {
  if (request.method !== 'GET') return false
  const url = new URL(request.url)
  return url.pathname === '/health' || url.pathname === '/healthz'
}

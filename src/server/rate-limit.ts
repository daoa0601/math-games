// In-isolate write throttle: rejects mutations from the same key within a
// short window. This is defense-in-depth — it bounds per-player write rate
// inside one worker isolate, not a global limiter. Cloudflare Rate Limiting
// Rules (configured at the edge) should handle DDoS-grade traffic per IP.
//
// The map is bounded so a misbehaving client can't grow it indefinitely;
// entries older than RETENTION_MS are pruned when the map crosses MAX_ENTRIES.

const WINDOW_MS = 250
const RETENTION_MS = 60_000
const MAX_ENTRIES = 1024

const lastWriteAt = new Map<string, number>()

export class RateLimitError extends Error {
  override readonly name = 'RateLimitError'
}

export function assertNotRateLimited(key: string): void {
  const now = Date.now()
  const previous = lastWriteAt.get(key)

  if (previous !== undefined && now - previous < WINDOW_MS) {
    throw new RateLimitError('Too many requests')
  }

  lastWriteAt.set(key, now)

  if (lastWriteAt.size > MAX_ENTRIES) {
    const cutoff = now - RETENTION_MS

    for (const [k, t] of lastWriteAt) {
      if (t < cutoff) lastWriteAt.delete(k)
    }
  }
}

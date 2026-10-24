import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import type { RequestOptions } from '@tanstack/react-start/server'
import type { Register } from '@tanstack/react-router'

import { handleHealthRequest, isHealthRequest } from './health-handler'

const handler = createStartHandler(defaultStreamHandler)

const CACHEABLE_PATTERNS = [/^\/$/, /^\/daily$/, /^\/games\//]
const CACHE_TTL: Record<string, number> = {
  '/': 300,
  '/daily': 60,
}
const DEFAULT_CACHE_TTL = 300

function isCacheable(request: Request): boolean {
  if (request.method !== 'GET') return false

  const cookie = request.headers.get('cookie') ?? ''
  if (cookie.includes('mg_player')) return false

  const url = new URL(request.url)
  return CACHEABLE_PATTERNS.some((p) => p.test(url.pathname))
}

function getCacheTtl(pathname: string): number {
  return CACHE_TTL[pathname] ?? DEFAULT_CACHE_TTL
}

declare const caches: { default: Cache }

export default {
  async fetch(
    request: Request,
    env: RequestOptions<Register>,
    ctx: ExecutionContext,
  ) {
    // Health probe — bypass the SSR pipeline and edge cache. Always returns
    // fresh; never cached.
    if (isHealthRequest(request)) {
      return handleHealthRequest()
    }

    if (!isCacheable(request)) {
      return handler(request, env)
    }

    const cache = caches.default
    const cacheKey = new Request(request.url, { method: 'GET' })

    // The edge cache (miniflare in dev, Cloudflare in prod) can throw
    // transient internal errors. Treat the cache as best-effort: a cache
    // failure must never 500 the page, just fall through to the handler.
    let cached: Response | undefined
    try {
      cached = await cache.match(cacheKey)
    } catch {
      cached = undefined
    }
    if (cached) {
      const response = new Response(cached.body, cached)
      response.headers.set('x-cache', 'HIT')
      return response
    }

    const response = await handler(request, env)

    if (response.status === 200) {
      const pathname = new URL(request.url).pathname
      const ttl = getCacheTtl(pathname)

      const cloned = new Response(response.body, response)
      cloned.headers.set('cache-control', `public, max-age=${ttl}`)
      cloned.headers.set('x-cache', 'MISS')

      try {
        ctx.waitUntil(cache.put(cacheKey, cloned.clone()))
      } catch {
        // Best-effort cache write; ignore failures.
      }

      return cloned
    }

    return response
  },
}

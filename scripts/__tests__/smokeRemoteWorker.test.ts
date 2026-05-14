import { describe, expect, it, vi } from 'vitest'

import {
  blockedRoutes,
  cloudflareEdgeHeader,
  requiredRoutes,
  runRemoteWorkerSmokeCli,
  runRemoteWorkerSmoke,
} from '../smokeRemoteWorker'

const cloudflareEdgeHeaders = {
  [cloudflareEdgeHeader]: '935f5c1f0f1d2c3b-SIN',
}

function routeResponse(path: string) {
  const requiredRoute = requiredRoutes.find((route) => route.path === path)

  if (requiredRoute !== undefined) {
    const expectedText = [
      requiredRoute.expectedText,
      ...(requiredRoute.expectedAdditionalText ?? []),
    ].join(' ')

    return new Response(`<html>${expectedText}</html>`, {
      headers: {
        ...cloudflareEdgeHeaders,
        ...(requiredRoute.expectedHeader !== undefined &&
        requiredRoute.expectedHeaderText !== undefined
          ? { [requiredRoute.expectedHeader]: requiredRoute.expectedHeaderText }
          : {}),
      },
      status: 200,
    })
  }

  if (blockedRoutes.includes(path as (typeof blockedRoutes)[number])) {
    return new Response('not found', {
      headers: cloudflareEdgeHeaders,
      status: 404,
    })
  }

  return new Response('not found', {
    headers: cloudflareEdgeHeaders,
    status: 404,
  })
}

describe('remote Worker smoke', () => {
  it('requires a deployed Worker URL or Cloudflare API credentials', async () => {
    await expect(
      runRemoteWorkerSmoke({
        env: {},
        remoteUrl: '',
        fetchImpl: vi.fn(),
      }),
    ).rejects.toThrow('START_REMOTE_URL must be set')
  })

  it('checks standalone routes and rejected old root routes', async () => {
    const fetchImpl = vi.fn(
      (input: string | URL | Request, _init?: RequestInit) => {
        const url = new URL(input.toString())

        return Promise.resolve(routeResponse(url.pathname))
      },
    )
    const log = vi.fn()

    await runRemoteWorkerSmoke({
      fetchImpl,
      log,
      remoteUrl: 'https://math-games.example.workers.dev',
    })

    expect(fetchImpl).toHaveBeenCalledTimes(
      requiredRoutes.length + blockedRoutes.length,
    )
    expect(
      fetchImpl.mock.calls.map(([input]) => new URL(input.toString()).pathname),
    ).toEqual([...requiredRoutes.map((route) => route.path), ...blockedRoutes])
    expect(fetchImpl.mock.calls.map(([, init]) => init)).toEqual(
      Array.from(
        { length: requiredRoutes.length + blockedRoutes.length },
        () => ({
          redirect: 'manual',
        }),
      ),
    )
    expect(log).toHaveBeenLastCalledWith('Remote Worker smoke passed.')
  })

  it('resolves workers.dev from CI credentials when remote URL is blank', async () => {
    const fetchImpl = vi.fn(
      (input: string | URL | Request, _init?: RequestInit) => {
        const url = new URL(input.toString())

        if (url.hostname === 'api.cloudflare.com') {
          if (url.pathname.endsWith('/workers/subdomain')) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  result: {
                    subdomain: 'math-games-account',
                  },
                  success: true,
                }),
                { status: 200 },
              ),
            )
          }

          if (url.pathname.endsWith('/workers/scripts/math-games/subdomain')) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  result: {
                    enabled: true,
                  },
                  success: true,
                }),
                { status: 200 },
              ),
            )
          }
        }

        return Promise.resolve(routeResponse(url.pathname))
      },
    )
    const log = vi.fn()

    await runRemoteWorkerSmoke({
      env: {
        CLOUDFLARE_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_API_TOKEN: 'api-token',
      },
      fetchImpl,
      log,
      remoteUrl: '',
    })

    expect(
      fetchImpl.mock.calls.map(([input]) => new URL(input.toString()).href),
    ).toContain('https://math-games.math-games-account.workers.dev/')
    const workerRouteCalls = fetchImpl.mock.calls.filter(
      ([input]) => new URL(input.toString()).hostname !== 'api.cloudflare.com',
    )
    expect(workerRouteCalls.map(([, init]) => init)).toEqual(
      Array.from(
        { length: requiredRoutes.length + blockedRoutes.length },
        () => ({
          redirect: 'manual',
        }),
      ),
    )
    expect(log).toHaveBeenLastCalledWith('Remote Worker smoke passed.')
  })

  it('fails when a deployed route lacks Cloudflare edge proof', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/') {
        return Promise.resolve(new Response('<html>Practice dashboard</html>'))
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('Cloudflare edge header cf-ray')
  })

  it('fails when a deployed route has a malformed Cloudflare edge proof', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/') {
        return Promise.resolve(
          new Response('<html>Practice dashboard</html>', {
            headers: {
              [cloudflareEdgeHeader]: 'not-a-ray-id',
            },
          }),
        )
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('valid Cloudflare Ray ID')
  })

  it('fails when a required standalone route redirects instead of rendering', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/games/magic-graph') {
        return Promise.resolve(
          new Response(null, {
            headers: {
              ...cloudflareEdgeHeaders,
              location: '/',
            },
            status: 302,
          }),
        )
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('Expected /games/magic-graph to return 2xx')
  })

  it('fails when a rejected old root route lacks Cloudflare edge proof', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/magic-graph') {
        return Promise.resolve(new Response('not found', { status: 404 }))
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('Cloudflare edge header cf-ray')
  })

  it('fails when an old root game path is still served', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/magic-graph') {
        return Promise.resolve(
          new Response('old root route', {
            headers: cloudflareEdgeHeaders,
            status: 200,
          }),
        )
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('return 404 not found')
  })

  it('fails when the profile route does not expose the D1-backed marker', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/profile') {
        return Promise.resolve(
          new Response('<html>Player Profile</html>', {
            headers: {
              ...cloudflareEdgeHeaders,
              'set-cookie': 'mg_player=player-id',
            },
            status: 200,
          }),
        )
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('D1-backed profile state')
  })

  it('fails when the daily route does not expose the D1-backed marker', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/daily') {
        return Promise.resolve(
          new Response('<html>Daily Challenge</html>', {
            headers: cloudflareEdgeHeaders,
            status: 200,
          }),
        )
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('D1-backed daily challenge row')
  })

  it('fails when an old root game path redirects to a standalone path', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/magic-graph') {
        return Promise.resolve(
          new Response(null, {
            headers: {
              ...cloudflareEdgeHeaders,
              location: '/games/magic-graph',
            },
            status: 302,
          }),
        )
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('return 404 not found')
  })

  it('fails when an old root game path returns a server error instead of a not found', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname === '/magic-graph') {
        return Promise.resolve(
          new Response('server error', {
            headers: cloudflareEdgeHeaders,
            status: 500,
          }),
        )
      }

      return Promise.resolve(routeResponse(url.pathname))
    })

    await expect(
      runRemoteWorkerSmoke({
        fetchImpl,
        log: vi.fn(),
        remoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).rejects.toThrow('return 404 not found')
  })

  it('returns a readable CLI failure without throwing', async () => {
    const messages: string[] = []

    await expect(
      runRemoteWorkerSmokeCli({
        env: {},
        error: (message) => messages.push(message),
        fetchImpl: vi.fn(),
        log: vi.fn(),
        remoteUrl: '',
      }),
    ).resolves.toBe(1)
    expect(messages[0]).toContain('START_REMOTE_URL must be set')
  })
})

import { describe, expect, it, vi } from 'vitest'

import {
  checkRemoteSmokeEnv,
  runRemoteSmokeEnvCheck,
} from '../checkRemoteSmokeEnv'

describe('remote smoke environment preflight', () => {
  it('requires START_REMOTE_URL or Cloudflare API credentials', async () => {
    await expect(checkRemoteSmokeEnv('', { env: {} })).rejects.toThrow(
      'START_REMOTE_URL must be set',
    )
  })

  it('accepts a deployed Worker origin', async () => {
    await expect(
      checkRemoteSmokeEnv('https://math-games.example.workers.dev'),
    ).resolves.toBe(
      'Remote Worker smoke target verified: https://math-games.example.workers.dev',
    )
  })

  it('rejects explicit remote smoke URLs with path, query, or fragment data', async () => {
    for (const rawRemoteUrl of [
      'https://math-games.example.workers.dev/nested',
      'https://math-games.example.workers.dev?debug=true',
      'https://math-games.example.workers.dev#deploy',
    ]) {
      await expect(checkRemoteSmokeEnv(rawRemoteUrl)).rejects.toThrow(
        'origin without path, query, or fragment',
      )
    }
  })

  it('rejects local and private explicit remote smoke URLs', async () => {
    for (const rawRemoteUrl of [
      'https://localhost:3000',
      'https://127.0.0.1:3000',
      'https://100.64.0.5',
      'https://192.168.1.20',
      'https://198.18.0.5',
      'https://8.8.8.8',
      'https://[2606:4700:4700::1111]',
    ]) {
      await expect(checkRemoteSmokeEnv(rawRemoteUrl)).rejects.toThrow(
        'deployed Cloudflare Worker origin',
      )
    }
  })

  it('rejects plain HTTP explicit remote smoke URLs', async () => {
    await expect(
      checkRemoteSmokeEnv('http://math-games.example.workers.dev'),
    ).rejects.toThrow('HTTPS origin')
  })

  it('rejects explicit remote smoke URLs with non-default HTTPS ports', async () => {
    await expect(
      checkRemoteSmokeEnv('https://math-games.example.workers.dev:8443'),
    ).rejects.toThrow('default HTTPS port')
  })

  it('resolves the workers.dev origin from Cloudflare API credentials', async () => {
    const apiResponses: [Response, Response] = [
      new Response(
        JSON.stringify({
          result: {
            subdomain: 'math-games-account',
          },
          success: true,
        }),
        { status: 200 },
      ),
      new Response(
        JSON.stringify({
          result: {
            enabled: true,
          },
          success: true,
        }),
        { status: 200 },
      ),
    ]
    let apiResponseIndex = 0
    const fetchImpl = vi.fn(() => {
      const response = apiResponses[apiResponseIndex]
      apiResponseIndex += 1

      return Promise.resolve(response)
    })

    await expect(
      checkRemoteSmokeEnv('', {
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account-id',
          CLOUDFLARE_API_TOKEN: 'api-token',
        },
        fetchImpl,
      }),
    ).resolves.toBe(
      'Remote Worker smoke target verified: https://math-games.math-games-account.workers.dev',
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account-id/workers/subdomain',
      expect.any(Object),
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account-id/workers/scripts/math-games/subdomain',
      expect.any(Object),
    )
  })

  it('returns a readable CLI failure without throwing', async () => {
    const messages: string[] = []

    await expect(
      runRemoteSmokeEnvCheck({
        error: (message) => messages.push(message),
        env: {},
        log: () => undefined,
        rawRemoteUrl: '',
      }),
    ).resolves.toBe(1)
    expect(messages[0]).toContain('START_REMOTE_URL must be set')
    expect(messages[0]).toContain('D1-backed profile state')
    expect(messages[0]).toContain('mg_player')
    expect(messages[0]).toContain('D1-backed daily challenge row')
  })
})

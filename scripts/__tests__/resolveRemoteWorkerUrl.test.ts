import { describe, expect, it, vi } from 'vitest'

import {
  defaultWorkerName,
  remoteSmokeCompletionProof,
  resolveRemoteWorkerBaseUrl,
} from '../resolveRemoteWorkerUrl'

function cloudflareResponse(result: unknown, status = 200) {
  return new Response(
    JSON.stringify({
      result,
      success: status >= 200 && status < 300,
    }),
    {
      headers: {
        'content-type': 'application/json',
      },
      status,
    },
  )
}

describe('remote Worker URL resolver', () => {
  it('keeps the default Worker name aligned with deployment resources', () => {
    expect(defaultWorkerName).toBe('math-games')
  })

  it('accepts an explicit remote Worker origin', async () => {
    const fetchImpl = vi.fn()

    await expect(
      resolveRemoteWorkerBaseUrl({
        fetchImpl,
        rawRemoteUrl: 'https://math-games.example.workers.dev',
      }),
    ).resolves.toEqual(new URL('https://math-games.example.workers.dev/'))
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('requires an explicit remote Worker URL to be an origin without path, query, or fragment', async () => {
    for (const rawRemoteUrl of [
      'https://math-games.example.workers.dev/nested',
      'https://math-games.example.workers.dev?debug=true',
      'https://math-games.example.workers.dev#deploy',
    ]) {
      await expect(
        resolveRemoteWorkerBaseUrl({
          rawRemoteUrl,
        }),
      ).rejects.toThrow('origin without path, query, or fragment')
    }
  })

  it('requires an explicit remote Worker URL to use HTTPS', async () => {
    for (const rawRemoteUrl of [
      'ftp://math-games.example.workers.dev',
      'http://math-games.example.workers.dev',
    ]) {
      await expect(
        resolveRemoteWorkerBaseUrl({
          rawRemoteUrl,
        }),
      ).rejects.toThrow('HTTPS origin')
    }
  })

  it('requires an explicit remote Worker URL to use the default HTTPS port', async () => {
    await expect(
      resolveRemoteWorkerBaseUrl({
        rawRemoteUrl: 'https://math-games.example.workers.dev:8443',
      }),
    ).rejects.toThrow('default HTTPS port')
  })

  it('rejects local and private hosts as explicit remote Worker URLs', async () => {
    for (const rawRemoteUrl of [
      'https://localhost:3000',
      'https://127.0.0.1:3000',
      'https://10.0.0.5',
      'https://100.64.0.5',
      'https://172.16.0.5',
      'https://192.168.1.20',
      'https://198.18.0.5',
      'https://[::1]:3000',
    ]) {
      await expect(
        resolveRemoteWorkerBaseUrl({
          rawRemoteUrl,
        }),
      ).rejects.toThrow('deployed Cloudflare Worker origin')
    }
  })

  it('rejects IP literals as explicit remote Worker URLs', async () => {
    for (const rawRemoteUrl of [
      'https://8.8.8.8',
      'https://[2606:4700:4700::1111]',
    ]) {
      await expect(
        resolveRemoteWorkerBaseUrl({
          rawRemoteUrl,
        }),
      ).rejects.toThrow('by hostname, not an IP address')
    }
  })

  it('requires either START_REMOTE_URL or Cloudflare API credentials', async () => {
    await expect(
      resolveRemoteWorkerBaseUrl({
        env: {},
        rawRemoteUrl: '',
      }),
    ).rejects.toThrow('START_REMOTE_URL must be set')
    await expect(
      resolveRemoteWorkerBaseUrl({
        env: {},
        rawRemoteUrl: '',
      }),
    ).rejects.toThrow(remoteSmokeCompletionProof)
  })

  it('resolves the workers.dev URL from Cloudflare API credentials', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname.endsWith('/workers/subdomain')) {
        return Promise.resolve(
          cloudflareResponse({
            subdomain: 'math-games-account',
          }),
        )
      }

      if (url.pathname.endsWith('/workers/scripts/math-games/subdomain')) {
        return Promise.resolve(
          cloudflareResponse({
            enabled: true,
          }),
        )
      }

      return Promise.resolve(cloudflareResponse({}, 404))
    })

    await expect(
      resolveRemoteWorkerBaseUrl({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account-id',
          CLOUDFLARE_API_TOKEN: 'api-token',
        },
        fetchImpl,
        rawRemoteUrl: '',
      }),
    ).resolves.toEqual(
      new URL('https://math-games.math-games-account.workers.dev/'),
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account-id/workers/subdomain',
      {
        headers: {
          Authorization: 'Bearer api-token',
        },
      },
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account-id/workers/scripts/math-games/subdomain',
      {
        headers: {
          Authorization: 'Bearer api-token',
        },
      },
    )
  })

  it('requires an explicit remote URL when workers.dev is disabled', async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = new URL(input.toString())

      if (url.pathname.endsWith('/workers/subdomain')) {
        return Promise.resolve(
          cloudflareResponse({
            subdomain: 'math-games-account',
          }),
        )
      }

      return Promise.resolve(
        cloudflareResponse({
          enabled: false,
        }),
      )
    })

    await expect(
      resolveRemoteWorkerBaseUrl({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account-id',
          CLOUDFLARE_API_TOKEN: 'api-token',
        },
        fetchImpl,
        rawRemoteUrl: '',
      }),
    ).rejects.toThrow('Set START_REMOTE_URL')
    await expect(
      resolveRemoteWorkerBaseUrl({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account-id',
          CLOUDFLARE_API_TOKEN: 'api-token',
        },
        fetchImpl,
        rawRemoteUrl: '',
      }),
    ).rejects.toThrow('D1-backed daily challenge row')
  })
})

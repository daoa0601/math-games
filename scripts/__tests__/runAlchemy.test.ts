import { describe, expect, it, vi } from 'vitest'

import {
  createAlchemyEnvironment,
  runAlchemyCommand,
  usesScopedTokenAuth,
} from '../runAlchemy'
import type { AlchemySpawn } from '../runAlchemy'

describe('Alchemy command runner', () => {
  it('detects scoped Cloudflare token auth only when both variables are set', () => {
    expect(
      usesScopedTokenAuth({
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'token',
      }),
    ).toBe(true)

    expect(
      usesScopedTokenAuth({
        CLOUDFLARE_ACCOUNT_ID: 'account',
      }),
    ).toBe(false)
  })

  it('forces Alchemy env auth mode for scoped-token deploys', () => {
    expect(
      createAlchemyEnvironment({
        CI: 'false',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'token',
      }).CI,
    ).toBe('true')
  })

  it('keeps profile auth outside CI mode when token auth is absent', () => {
    expect(
      createAlchemyEnvironment({
        ALCHEMY_PROFILE: 'dev',
      }).CI,
    ).toBeUndefined()
  })

  it('spawns the local Alchemy binary with the normalized environment', () => {
    const spawn = vi.fn<AlchemySpawn>(() => ({
      signal: null,
      status: 0,
    }))

    const exitCode = runAlchemyCommand(['plan', '--stage', 'dev'], {
      env: {
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'token',
      },
      spawn,
    })

    expect(exitCode).toBe(0)
    expect(spawn).toHaveBeenCalledWith('alchemy', ['plan', '--stage', 'dev'], {
      env: expect.objectContaining({
        CI: 'true',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'token',
      }) as Record<string, string | undefined>,
      stdio: 'inherit',
    })
  })
})

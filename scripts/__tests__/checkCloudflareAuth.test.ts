import { describe, expect, it, vi } from 'vitest'

import {
  checkCloudflareAuth,
  CloudflareAuthCheckError,
} from '../checkCloudflareAuth'

function cloudflareResponse(result: unknown, status: number = 200) {
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

function stateStoreFetch({
  edgeHeaderValue = '935f5c1f0f1d2c3b-SIN',
  includeEdgeHeader = true,
  version = 4,
  workerSubdomainEnabled = true,
}: {
  edgeHeaderValue?: string
  includeEdgeHeader?: boolean
  version?: number
  workerSubdomainEnabled?: boolean
} = {}) {
  return vi.fn((input: string | URL | Request) => {
    const url = new URL(input.toString())

    if (
      url.pathname.endsWith('/workers/scripts/alchemy-state-store/subdomain')
    ) {
      return Promise.resolve(
        cloudflareResponse({
          enabled: workerSubdomainEnabled,
        }),
      )
    }

    if (url.pathname.endsWith('/workers/subdomain')) {
      return Promise.resolve(
        cloudflareResponse({
          subdomain: 'math-games-account',
        }),
      )
    }

    if (url.pathname === '/version') {
      return Promise.resolve(
        new Response(JSON.stringify({ version }), {
          headers: {
            ...(includeEdgeHeader ? { 'cf-ray': edgeHeaderValue } : {}),
            'content-type': 'application/json',
          },
        }),
      )
    }

    return Promise.resolve(cloudflareResponse({}, 404))
  })
}

describe('Cloudflare auth preflight', () => {
  it('requires an account id for environment auth', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_API_TOKEN: 'token',
        },
      }),
    ).rejects.toThrow('Cloudflare env auth requires CLOUDFLARE_ACCOUNT_ID')
  })

  it('requires an auth token when running in CI', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CI: 'true',
          CLOUDFLARE_ACCOUNT_ID: 'account',
        },
      }),
    ).rejects.toThrow('Cloudflare env auth requires CLOUDFLARE_API_TOKEN')
  })

  it('requires account id when CI secrets are empty strings', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CI: 'true',
          CLOUDFLARE_ACCOUNT_ID: '',
          CLOUDFLARE_API_TOKEN: '',
        },
      }),
    ).rejects.toThrow('Cloudflare env auth requires CLOUDFLARE_ACCOUNT_ID')
  })

  it('requires an auth token when an account id is present outside CI', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
        },
      }),
    ).rejects.toThrow('Cloudflare env auth requires CLOUDFLARE_API_TOKEN')
  })

  it('rejects Cloudflare API key/email auth', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_KEY: 'key',
          CLOUDFLARE_EMAIL: 'admin@example.com',
        },
      }),
    ).rejects.toThrow('API key/email auth is not supported')
  })

  it('fails env auth when Wrangler rejects the credentials', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        runWranglerWhoami: () => ({
          status: 1,
          stderr: 'not authenticated',
        }),
      }),
    ).rejects.toThrow('pnpm infra:login')
  })

  it('accepts validated environment auth and state-store health', async () => {
    const fetchImpl = stateStoreFetch()
    const runWranglerWhoami = vi.fn(() => ({
      status: 0,
      stdout: 'You are logged in',
    }))

    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        fetchImpl,
        runWranglerWhoami,
      }),
    ).resolves.toBe(
      'Cloudflare environment authentication and Cloudflare state store are verified.',
    )
    expect(runWranglerWhoami).toHaveBeenCalledOnce()
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account/workers/subdomain',
      {
        headers: {
          Authorization: 'Bearer token',
        },
      },
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account/workers/scripts/alchemy-state-store/subdomain',
      {
        headers: {
          Authorization: 'Bearer token',
        },
      },
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL(
        'https://alchemy-state-store.math-games-account.workers.dev/version',
      ),
    )
  })

  it('rejects environment auth when the state-store version probe fails', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        fetchImpl: stateStoreFetch({ version: 3 }),
        runWranglerWhoami: () => ({
          status: 0,
          stdout: 'You are logged in',
        }),
      }),
    ).rejects.toThrow('Cloudflare state store version mismatch')
  })

  it('rejects environment auth when the state-store workers.dev route is disabled', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        fetchImpl: stateStoreFetch({ workerSubdomainEnabled: false }),
        runWranglerWhoami: () => ({
          status: 0,
          stdout: 'You are logged in',
        }),
      }),
    ).rejects.toThrow('not enabled on workers.dev')
  })

  it('rejects environment auth when the state-store version probe lacks Cloudflare edge proof', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        fetchImpl: stateStoreFetch({ includeEdgeHeader: false }),
        runWranglerWhoami: () => ({
          status: 0,
          stdout: 'You are logged in',
        }),
      }),
    ).rejects.toThrow('Cloudflare edge header cf-ray')
  })

  it('rejects environment auth when the state-store version probe has a malformed Cloudflare edge proof', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        fetchImpl: stateStoreFetch({ edgeHeaderValue: 'not-a-ray-id' }),
        runWranglerWhoami: () => ({
          status: 0,
          stdout: 'You are logged in',
        }),
      }),
    ).rejects.toThrow('valid Cloudflare Ray ID')
  })

  it('rejects environment auth when the state-store version endpoint is unreachable', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        fetchImpl: vi.fn((input: string | URL | Request) => {
          const url = new URL(input.toString())

          if (url.pathname.endsWith('/workers/subdomain')) {
            return Promise.resolve(
              cloudflareResponse({
                subdomain: 'math-games-account',
              }),
            )
          }

          if (
            url.pathname.endsWith(
              '/workers/scripts/alchemy-state-store/subdomain',
            )
          ) {
            return Promise.resolve(
              cloudflareResponse({
                enabled: true,
              }),
            )
          }

          return Promise.reject(new Error('network unavailable'))
        }),
        runWranglerWhoami: () => ({
          status: 0,
          stdout: 'You are logged in',
        }),
      }),
    ).rejects.toThrow('Unable to reach Cloudflare state store version endpoint')
  })

  it('rejects environment auth when the state-store version endpoint is unreadable', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        fetchImpl: vi.fn((input: string | URL | Request) => {
          const url = new URL(input.toString())

          if (url.pathname.endsWith('/workers/subdomain')) {
            return Promise.resolve(
              cloudflareResponse({
                subdomain: 'math-games-account',
              }),
            )
          }

          if (
            url.pathname.endsWith(
              '/workers/scripts/alchemy-state-store/subdomain',
            )
          ) {
            return Promise.resolve(
              cloudflareResponse({
                enabled: true,
              }),
            )
          }

          return Promise.resolve(
            new Response('<html>not json</html>', {
              headers: {
                'cf-ray': '935f5c1f0f1d2c3b-SIN',
                'content-type': 'text/html',
              },
            }),
          )
        }),
        runWranglerWhoami: () => ({
          status: 0,
          stdout: 'You are logged in',
        }),
      }),
    ).rejects.toThrow(
      'Cloudflare state store version endpoint returned an unreadable response',
    )
  })

  it('can validate environment auth without requiring state store credentials', async () => {
    const runWranglerWhoami = vi.fn(() => ({
      status: 0,
      stdout: 'You are logged in',
    }))

    await expect(
      checkCloudflareAuth({
        env: {
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_API_TOKEN: 'token',
        },
        requireStateStore: false,
        runWranglerWhoami,
      }),
    ).resolves.toBe('Cloudflare environment authentication verified.')
  })

  it('requires a local Alchemy profile when env auth is absent', async () => {
    await expect(
      checkCloudflareAuth({
        env: {},
        profileExists: () => false,
      }),
    ).rejects.toThrow('pnpm infra:login')
  })

  it('points missing profile auth at the local token env-file path', async () => {
    await expect(
      checkCloudflareAuth({
        env: {},
        profileExists: () => false,
      }),
    ).rejects.toThrow('.env')
    await expect(
      checkCloudflareAuth({
        env: {},
        profileExists: () => false,
      }),
    ).rejects.toThrow('state-store Worker /version probe passes')
  })

  it('points profile entries without Cloudflare credentials at token auth', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        profileExists: () => true,
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {},
            },
          }),
      }),
    ).rejects.toThrow('CLOUDFLARE_API_TOKEN')
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        profileExists: () => true,
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {},
            },
          }),
      }),
    ).rejects.toThrow('pnpm infra:check')
  })

  it('requires local Cloudflare state store credentials with profile auth', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        profileExists: () => true,
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {
                Cloudflare: {
                  accountId: 'account',
                },
              },
            },
          }),
        stateStoreCredentialsExists: () => false,
      }),
    ).rejects.toThrow('pnpm infra:bootstrap')
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        profileExists: () => true,
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {
                Cloudflare: {
                  accountId: 'account',
                },
              },
            },
          }),
        stateStoreCredentialsExists: () => false,
      }),
    ).rejects.toThrow('state-store Worker /version probe passes')
  })

  it('can validate a local profile before state store bootstrap', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        profileExists: () => true,
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {
                Cloudflare: {
                  accountId: 'account',
                },
              },
            },
          }),
        requireStateStore: false,
        stateStoreCredentialsExists: () => false,
      }),
    ).resolves.toBe("Alchemy Cloudflare profile 'dev' is configured.")
  })

  it('accepts a local Alchemy profile with Cloudflare state store credentials', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        fetchImpl: stateStoreFetch(),
        profileExists: () => true,
        readStateStoreCredentials: () =>
          JSON.stringify({
            url: 'https://alchemy-state-store.math-games-account.workers.dev',
          }),
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {
                Cloudflare: {
                  accountId: 'account',
                },
              },
            },
          }),
        stateStoreCredentialsExists: () => true,
      }),
    ).resolves.toBe(
      "Alchemy Cloudflare profile 'dev' and Cloudflare state store are verified.",
    )
  })

  it('rejects local profile auth when the state-store credentials omit the URL', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        profileExists: () => true,
        readStateStoreCredentials: () => JSON.stringify({}),
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {
                Cloudflare: {
                  accountId: 'account',
                },
              },
            },
          }),
        stateStoreCredentialsExists: () => true,
      }),
    ).rejects.toThrow('did not include a Worker URL')
  })

  it('rejects local profile auth when state-store credentials use plain HTTP', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        profileExists: () => true,
        readStateStoreCredentials: () =>
          JSON.stringify({
            url: 'http://alchemy-state-store.math-games-account.workers.dev',
          }),
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {
                Cloudflare: {
                  accountId: 'account',
                },
              },
            },
          }),
        stateStoreCredentialsExists: () => true,
      }),
    ).rejects.toThrow('Cloudflare state store URL must use HTTPS')
  })

  it('rejects local profile auth when state-store credentials use a non-default HTTPS port', async () => {
    await expect(
      checkCloudflareAuth({
        env: {
          ALCHEMY_PROFILE: 'dev',
        },
        profileExists: () => true,
        readStateStoreCredentials: () =>
          JSON.stringify({
            url: 'https://alchemy-state-store.math-games-account.workers.dev:8443',
          }),
        readProfile: () =>
          JSON.stringify({
            profiles: {
              dev: {
                Cloudflare: {
                  accountId: 'account',
                },
              },
            },
          }),
        stateStoreCredentialsExists: () => true,
      }),
    ).rejects.toThrow(
      'Cloudflare state store URL must use the default HTTPS port',
    )
  })

  it('rejects local profile auth when state-store credentials include a path, query, or fragment', async () => {
    for (const url of [
      'https://alchemy-state-store.math-games-account.workers.dev/state',
      'https://alchemy-state-store.math-games-account.workers.dev?token=abc',
      'https://alchemy-state-store.math-games-account.workers.dev#ready',
    ]) {
      await expect(
        checkCloudflareAuth({
          env: {
            ALCHEMY_PROFILE: 'dev',
          },
          profileExists: () => true,
          readStateStoreCredentials: () => JSON.stringify({ url }),
          readProfile: () =>
            JSON.stringify({
              profiles: {
                dev: {
                  Cloudflare: {
                    accountId: 'account',
                  },
                },
              },
            }),
          stateStoreCredentialsExists: () => true,
        }),
      ).rejects.toThrow(
        'Cloudflare state store URL must be an origin without path, query, or fragment',
      )
    }
  })

  it('rejects local profile auth when state-store credentials do not point at the named workers.dev state-store Worker', async () => {
    for (const url of [
      'https://math-games-account.workers.dev',
      'https://state-store.example.com',
      'https://other-state-store.math-games-account.workers.dev',
    ]) {
      await expect(
        checkCloudflareAuth({
          env: {
            ALCHEMY_PROFILE: 'dev',
          },
          profileExists: () => true,
          readStateStoreCredentials: () => JSON.stringify({ url }),
          readProfile: () =>
            JSON.stringify({
              profiles: {
                dev: {
                  Cloudflare: {
                    accountId: 'account',
                  },
                },
              },
            }),
          stateStoreCredentialsExists: () => true,
        }),
      ).rejects.toThrow(
        'Cloudflare state store URL must use the alchemy-state-store workers.dev hostname',
      )
    }
  })

  it('rejects local profile auth when state-store credentials point to local or private origins', async () => {
    for (const url of [
      'https://localhost:8787',
      'https://state-store.local',
      'https://10.0.0.5',
    ]) {
      await expect(
        checkCloudflareAuth({
          env: {
            ALCHEMY_PROFILE: 'dev',
          },
          profileExists: () => true,
          readStateStoreCredentials: () => JSON.stringify({ url }),
          readProfile: () =>
            JSON.stringify({
              profiles: {
                dev: {
                  Cloudflare: {
                    accountId: 'account',
                  },
                },
              },
            }),
          stateStoreCredentialsExists: () => true,
        }),
      ).rejects.toThrow(
        'Cloudflare state store URL must point to a deployed Worker origin',
      )
    }
  })

  it('rejects local profile auth when state-store credentials use an IP literal', async () => {
    for (const url of ['https://8.8.8.8', 'https://[2606:4700:4700::1111]']) {
      await expect(
        checkCloudflareAuth({
          env: {
            ALCHEMY_PROFILE: 'dev',
          },
          profileExists: () => true,
          readStateStoreCredentials: () => JSON.stringify({ url }),
          readProfile: () =>
            JSON.stringify({
              profiles: {
                dev: {
                  Cloudflare: {
                    accountId: 'account',
                  },
                },
              },
            }),
          stateStoreCredentialsExists: () => true,
        }),
      ).rejects.toThrow('not an IP address')
    }
  })

  it('uses a typed auth error for CLI failures', async () => {
    await expect(
      checkCloudflareAuth({
        env: {},
        profileExists: () => false,
      }),
    ).rejects.toThrow(CloudflareAuthCheckError)
  })
})

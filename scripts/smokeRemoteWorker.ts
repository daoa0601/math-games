import 'dotenv/config'

/* eslint-disable @typescript-eslint/no-unnecessary-condition -- remote Worker smoke checks depend on runtime env, fetch status, and response headers */

import { pathToFileURL } from 'node:url'

import { resolveRemoteWorkerBaseUrl } from './resolveRemoteWorkerUrl'

export {}

export interface RequiredRoute {
  path: string
  expectedText: string
  expectedAdditionalText?: readonly string[]
  expectedHeader?: string
  expectedHeaderText?: string
}

export interface RemoteWorkerSmokeOptions {
  env?: Record<string, string | undefined>
  remoteUrl?: string
  fetchImpl?: typeof fetch
  log?: (message: string) => void
}

export interface RemoteWorkerSmokeCliOptions extends RemoteWorkerSmokeOptions {
  error?: (message: string) => void
}

export const requiredRoutes: readonly RequiredRoute[] = [
  {
    path: '/',
    expectedText: 'Math Games',
    expectedAdditionalText: ['D1-backed profile state'],
  },
  {
    path: '/daily',
    expectedText: 'Daily Challenge',
    expectedAdditionalText: ['D1-backed daily challenge row'],
  },
  {
    path: '/profile',
    expectedText: 'Player Profile',
    expectedAdditionalText: ['D1-backed profile state'],
    expectedHeader: 'set-cookie',
    expectedHeaderText: 'mg_player=',
  },
  {
    path: '/games/magic-graph',
    expectedText: 'Numbers',
  },
  {
    path: '/games/sequence-race',
    expectedText: 'Race Line',
  },
  {
    path: '/games/shape-architect',
    expectedText: 'Blueprint',
  },
] as const

export const blockedRoutes = [
  '/magic-graph',
  '/sequence-race',
  '/shape-architect',
] as const
export const cloudflareEdgeHeader = 'cf-ray'
const cloudflareRayIdPattern = /^[0-9a-f]+-[A-Z]{3}$/i

function fail(message: string): never {
  throw new Error(message)
}

function routeUrl(baseUrl: URL, path: string) {
  return new URL(path, baseUrl)
}

async function readRoute(baseUrl: URL, path: string, fetchImpl: typeof fetch) {
  const response = await fetchImpl(routeUrl(baseUrl, path), {
    redirect: 'manual',
  })
  const body = await response.text()

  return { body, response }
}

function assertCloudflareEdgeResponse(path: string, response: Response) {
  const headerValue = response.headers.get(cloudflareEdgeHeader)

  if (headerValue === null || headerValue.trim() === '') {
    fail(
      `Expected ${path} response to include Cloudflare edge header ${cloudflareEdgeHeader}.`,
    )
  }

  if (!cloudflareRayIdPattern.test(headerValue.trim())) {
    fail(
      `Expected ${path} response header ${cloudflareEdgeHeader} to include a valid Cloudflare Ray ID.`,
    )
  }
}

export async function runRemoteWorkerSmoke({
  env = process.env,
  remoteUrl,
  fetchImpl = fetch,
  log = console.log,
}: RemoteWorkerSmokeOptions = {}) {
  const baseUrl = await resolveRemoteWorkerBaseUrl({
    env,
    fetchImpl,
    rawRemoteUrl: remoteUrl,
  })

  for (const route of requiredRoutes) {
    const { body, response } = await readRoute(baseUrl, route.path, fetchImpl)
    assertCloudflareEdgeResponse(route.path, response)

    if (!response.ok) {
      fail(
        `Expected ${route.path} to return 2xx, got ${response.status} ${response.statusText}`,
      )
    }

    for (const expectedText of [
      route.expectedText,
      ...(route.expectedAdditionalText ?? []),
    ]) {
      if (!body.includes(expectedText)) {
        fail(`Expected ${route.path} to include "${expectedText}".`)
      }
    }

    if (
      route.expectedHeader !== undefined &&
      route.expectedHeaderText !== undefined
    ) {
      const headerValue = response.headers.get(route.expectedHeader)

      if (headerValue?.includes(route.expectedHeaderText) !== true) {
        fail(
          `Expected ${route.path} response header ${route.expectedHeader} to include ${route.expectedHeaderText}.`,
        )
      }
    }

    log(`ok - remote route ${route.path}`)
  }

  for (const path of blockedRoutes) {
    const { response } = await readRoute(baseUrl, path, fetchImpl)
    assertCloudflareEdgeResponse(path, response)

    if (response.status !== 404) {
      fail(
        `Expected old root game route ${path} to return 404 not found instead of being served or redirected, got ${response.status}.`,
      )
    }

    log(`ok - old root game route rejected ${path}`)
  }

  log('Remote Worker smoke passed.')
}

export async function runRemoteWorkerSmokeCli({
  error = console.error,
  ...options
}: RemoteWorkerSmokeCliOptions = {}) {
  try {
    await runRemoteWorkerSmoke(options)

    return 0
  } catch (caught) {
    error(caught instanceof Error ? caught.message : String(caught))

    return 1
  }
}

function isMainModule() {
  const entrypoint = process.argv[1]

  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  )
}

if (isMainModule()) {
  process.exitCode = await runRemoteWorkerSmokeCli()
}

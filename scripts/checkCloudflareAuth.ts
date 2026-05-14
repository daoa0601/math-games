import 'dotenv/config'

/* eslint-disable @typescript-eslint/no-unnecessary-condition -- deploy auth checks depend on runtime env, but generated Worker env types make some keys look static */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { isIP } from 'node:net'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const hasValue = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

export interface CloudflareAuthEnv {
  [key: string]: string | undefined
  ALCHEMY_PROFILE?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_API_TOKEN?: string
  CI?: string
}

export interface WranglerWhoamiResult {
  status: number | null
  stdout?: string
  stderr?: string
  error?: Error
}

export interface CheckCloudflareAuthOptions {
  env?: CloudflareAuthEnv
  fetchImpl?: typeof fetch
  requireStateStore?: boolean
  profilePath?: string
  profileExists?: (path: string) => boolean
  readProfile?: (path: string) => string
  stateStoreCredentialsPath?: string
  stateStoreCredentialsExists?: (path: string) => boolean
  readStateStoreCredentials?: (path: string) => string
  runWranglerWhoami?: () => WranglerWhoamiResult
  stateStoreExpectedVersion?: number
  stateStoreWorkerName?: string
}

export class CloudflareAuthCheckError extends Error {
  override readonly name = 'CloudflareAuthCheckError'
}

interface CloudflareApiEnvelope<TResult> {
  success?: boolean
  errors?: Array<{
    message?: string
  }>
  result?: TResult
}

interface AccountSubdomainResult {
  subdomain?: string
}

interface WorkerSubdomainResult {
  enabled?: boolean
}

interface StateStoreCredentials {
  url?: string
}

const defaultStateStoreWorkerName = 'alchemy-state-store'
const expectedStateStoreVersion = 4
const cloudflareEdgeHeader = 'cf-ray'
const cloudflareRayIdPattern = /^[0-9a-f]+-[A-Z]{3}$/i
const stateStoreReadinessGuidance =
  'Completion requires Cloudflare Alchemy state-store readiness: after auth, run pnpm infra:bootstrap and pnpm infra:check so the state-store Worker /version probe passes.'

function fail(message: string): never {
  throw new CloudflareAuthCheckError(message)
}

function normalizeHostname(hostname: string) {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^\[(.*)\]$/, '$1')
}

function isIpLiteral(hostname: string) {
  return isIP(normalizeHostname(hostname)) !== 0
}

function isLocalOrPrivateHost(hostname: string) {
  const normalizedHost = normalizeHostname(hostname)

  if (
    normalizedHost === 'localhost' ||
    normalizedHost.endsWith('.localhost') ||
    normalizedHost.endsWith('.local')
  ) {
    return true
  }

  const ipv4Parts = normalizedHost.split('.').map((part) => Number(part))

  if (
    ipv4Parts.length === 4 &&
    ipv4Parts.every(
      (part) => Number.isInteger(part) && part >= 0 && part <= 255,
    )
  ) {
    const [first = 0, second = 0] = ipv4Parts

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168)) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    )
  }

  return (
    normalizedHost === '::1' ||
    normalizedHost === '0:0:0:0:0:0:0:1' ||
    normalizedHost.startsWith('fc') ||
    normalizedHost.startsWith('fd') ||
    normalizedHost.startsWith('fe80:')
  )
}

function normalizeCloudflareStateStoreUrl(rawUrl: string, workerName: string) {
  const stateStoreUrl = (() => {
    try {
      return new URL(rawUrl.trim())
    } catch {
      fail('Cloudflare state store URL must be a valid deployed Worker URL.')
    }
  })()

  if (stateStoreUrl.protocol !== 'https:') {
    fail('Cloudflare state store URL must use HTTPS.')
  }

  if (isIpLiteral(stateStoreUrl.hostname)) {
    fail(
      'Cloudflare state store URL must point to a deployed Worker origin by hostname, not an IP address.',
    )
  }

  if (isLocalOrPrivateHost(stateStoreUrl.hostname)) {
    fail(
      'Cloudflare state store URL must point to a deployed Worker origin, not a local or private network host.',
    )
  }

  if (stateStoreUrl.port !== '') {
    fail('Cloudflare state store URL must use the default HTTPS port.')
  }

  if (
    stateStoreUrl.pathname !== '/' ||
    stateStoreUrl.search !== '' ||
    stateStoreUrl.hash !== ''
  ) {
    fail(
      'Cloudflare state store URL must be an origin without path, query, or fragment.',
    )
  }

  const expectedWorkersDevPrefix = `${workerName}.`
  const normalizedHostname = normalizeHostname(stateStoreUrl.hostname)

  if (
    !normalizedHostname.startsWith(expectedWorkersDevPrefix) ||
    !normalizedHostname.endsWith('.workers.dev')
  ) {
    fail(
      `Cloudflare state store URL must use the ${workerName} workers.dev hostname.`,
    )
  }

  return stateStoreUrl
}

function defaultRunWranglerWhoami(): WranglerWhoamiResult {
  const result = spawnSync('wrangler', ['whoami'], {
    encoding: 'utf8',
    timeout: 15_000,
  })

  return {
    error: result.error,
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  }
}

function assertWranglerWhoami(runWranglerWhoami: () => WranglerWhoamiResult) {
  const result = runWranglerWhoami()
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  const unauthenticated = output.toLowerCase().includes('not authenticated')

  if (result.error) {
    fail(`Unable to run \`wrangler whoami\`.\n${result.error.message}`)
  }

  if (result.status !== 0 || unauthenticated) {
    fail(
      [
        'Cloudflare environment credentials were found, but Wrangler could not validate them.',
        '',
        'For CI, set both:',
        '  CLOUDFLARE_ACCOUNT_ID',
        '  CLOUDFLARE_API_TOKEN',
        '',
        'For local profile auth, unset those variables and run from the repository root:',
        '  pnpm infra:login',
      ].join('\n'),
    )
  }
}

function cloudflareApiError<TResult>(
  envelope: CloudflareApiEnvelope<TResult>,
  fallback: string,
) {
  const messages = envelope.errors
    ?.map((error) => error.message)
    .filter((message): message is string => hasValue(message))

  return messages !== undefined && messages.length > 0
    ? messages.join('; ')
    : fallback
}

async function readCloudflareResult<TResult>(
  fetchImpl: typeof fetch,
  path: string,
  apiToken: string,
) {
  const response = await fetchImpl(
    `https://api.cloudflare.com/client/v4${path}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  )
  const envelope: CloudflareApiEnvelope<TResult> = await response.json()

  if (!response.ok || envelope.success === false) {
    fail(
      cloudflareApiError(
        envelope,
        `Cloudflare API request failed for ${path}: ${response.status} ${response.statusText}`,
      ),
    )
  }

  if (envelope.result === undefined) {
    fail(`Cloudflare API response for ${path} did not include a result.`)
  }

  return envelope.result
}

function readStateStoreUrlFromCredentials(
  rawCredentials: string,
  path: string,
) {
  const credentials = (() => {
    try {
      return JSON.parse(rawCredentials) as StateStoreCredentials
    } catch (error) {
      fail(
        [
          `Unable to read Cloudflare state store credentials at ${path}.`,
          error instanceof Error ? error.message : String(error),
        ].join('\n'),
      )
    }
  })()

  if (!hasValue(credentials.url)) {
    fail(
      `Cloudflare state store credentials at ${path} did not include a Worker URL.`,
    )
  }

  return credentials.url.trim()
}

async function resolveStateStoreUrlFromCloudflare({
  accountId,
  apiToken,
  fetchImpl,
  workerName,
}: {
  accountId: string
  apiToken: string
  fetchImpl: typeof fetch
  workerName: string
}) {
  const [accountSubdomain, workerSubdomain] = await Promise.all([
    readCloudflareResult<AccountSubdomainResult>(
      fetchImpl,
      `/accounts/${accountId}/workers/subdomain`,
      apiToken,
    ),
    readCloudflareResult<WorkerSubdomainResult>(
      fetchImpl,
      `/accounts/${accountId}/workers/scripts/${encodeURIComponent(workerName)}/subdomain`,
      apiToken,
    ),
  ])

  if (!hasValue(accountSubdomain.subdomain)) {
    fail('Cloudflare account does not have a workers.dev subdomain configured.')
  }

  if (workerSubdomain.enabled !== true) {
    fail(
      `Cloudflare state-store Worker ${workerName} is not enabled on workers.dev; run pnpm infra:bootstrap and pnpm infra:check before completion.`,
    )
  }

  return `https://${workerName}.${accountSubdomain.subdomain}.workers.dev`
}

async function assertStateStoreVersion({
  expectedVersion,
  fetchImpl,
  url,
  workerName,
}: {
  expectedVersion: number
  fetchImpl: typeof fetch
  url: string
  workerName: string
}) {
  const versionUrl = new URL(
    '/version',
    normalizeCloudflareStateStoreUrl(url, workerName),
  )
  const response = await fetchImpl(versionUrl).catch((error: unknown) => {
    fail(
      [
        `Unable to reach Cloudflare state store version endpoint at ${versionUrl.toString()}.`,
        error instanceof Error ? error.message : String(error),
      ].join('\n'),
    )
  })

  if (!response.ok) {
    fail(
      `Cloudflare state store version probe failed at ${versionUrl.toString()}: ${response.status} ${response.statusText}`,
    )
  }

  const edgeHeaderValue = response.headers.get(cloudflareEdgeHeader)

  if (edgeHeaderValue === null || edgeHeaderValue.trim() === '') {
    fail(
      `Cloudflare state store version probe at ${versionUrl.toString()} did not include Cloudflare edge header ${cloudflareEdgeHeader}.`,
    )
  }

  if (!cloudflareRayIdPattern.test(edgeHeaderValue.trim())) {
    fail(
      `Cloudflare state store version probe at ${versionUrl.toString()} did not include a valid Cloudflare Ray ID.`,
    )
  }

  const body = (await response.json().catch((error: unknown) => {
    fail(
      [
        `Cloudflare state store version endpoint returned an unreadable response at ${versionUrl.toString()}.`,
        error instanceof Error ? error.message : String(error),
      ].join('\n'),
    )
  })) as { version?: unknown }

  if (body.version !== expectedVersion) {
    fail(
      `Cloudflare state store version mismatch at ${versionUrl.toString()}: expected ${expectedVersion}, got ${String(body.version)}.`,
    )
  }
}

export async function checkCloudflareAuth({
  env = process.env,
  fetchImpl = fetch,
  requireStateStore = true,
  profilePath = join(homedir(), '.alchemy', 'profiles.json'),
  profileExists = existsSync,
  readProfile = (path: string) => readFileSync(path, 'utf8'),
  stateStoreCredentialsPath,
  stateStoreCredentialsExists = existsSync,
  readStateStoreCredentials = (path: string) => readFileSync(path, 'utf8'),
  runWranglerWhoami = defaultRunWranglerWhoami,
  stateStoreExpectedVersion = expectedStateStoreVersion,
  stateStoreWorkerName = defaultStateStoreWorkerName,
}: CheckCloudflareAuthOptions = {}) {
  const profileName = env.ALCHEMY_PROFILE ?? 'default'
  const resolvedStateStoreCredentialsPath =
    stateStoreCredentialsPath ??
    join(
      homedir(),
      '.alchemy',
      'credentials',
      profileName,
      'cloudflare-state-store.json',
    )
  const accountId = env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = env.CLOUDFLARE_API_TOKEN
  const runningInCi = env.CI === 'true'
  const hasApiToken = hasValue(apiToken)
  const hasAccountId = hasValue(accountId)
  const hasApiKeyAuth = hasValue(env.CLOUDFLARE_API_KEY)
  const hasEmailAuth = hasValue(env.CLOUDFLARE_EMAIL)
  const hasEnvAuth = hasAccountId || hasApiToken

  if (hasApiKeyAuth || hasEmailAuth) {
    fail(
      [
        'Cloudflare API key/email auth is not supported for this app.',
        '',
        'Use a scoped API token instead:',
        '  CLOUDFLARE_ACCOUNT_ID',
        '  CLOUDFLARE_API_TOKEN',
      ].join('\n'),
    )
  }

  if (hasEnvAuth || runningInCi) {
    if (!hasValue(accountId)) {
      fail(
        [
          'Cloudflare env auth requires CLOUDFLARE_ACCOUNT_ID.',
          '',
          'Alchemy resolves Cloudflare env credentials from:',
          '  CLOUDFLARE_ACCOUNT_ID',
          '  CLOUDFLARE_API_TOKEN',
        ].join('\n'),
      )
    }

    if (!hasValue(apiToken)) {
      fail(
        [
          'Cloudflare env auth requires CLOUDFLARE_API_TOKEN.',
          '',
          'For CI, prefer a scoped CLOUDFLARE_API_TOKEN.',
        ].join('\n'),
      )
    }

    assertWranglerWhoami(runWranglerWhoami)

    if (requireStateStore) {
      const stateStoreUrl = await resolveStateStoreUrlFromCloudflare({
        accountId: accountId.trim(),
        apiToken: apiToken.trim(),
        fetchImpl,
        workerName: stateStoreWorkerName,
      })
      await assertStateStoreVersion({
        expectedVersion: stateStoreExpectedVersion,
        fetchImpl,
        url: stateStoreUrl,
        workerName: stateStoreWorkerName,
      })

      return 'Cloudflare environment authentication and Cloudflare state store are verified.'
    }

    return requireStateStore
      ? 'Cloudflare environment authentication and Cloudflare state store are verified.'
      : 'Cloudflare environment authentication verified.'
  }

  if (!profileExists(profilePath)) {
    fail(
      [
        `Alchemy profile '${profileName}' was not found.`,
        '',
        'For local deployment, run from the repository root:',
        '  pnpm infra:login',
        '',
        'Or use scoped token auth by exporting these variables or adding them to .env:',
        '  CLOUDFLARE_ACCOUNT_ID',
        '  CLOUDFLARE_API_TOKEN',
        '',
        stateStoreReadinessGuidance,
      ].join('\n'),
    )
  }

  const profileConfig: {
    profiles?: Record<string, Record<string, unknown>>
  } = (() => {
    try {
      return JSON.parse(readProfile(profilePath))
    } catch (error) {
      fail(
        [
          `Unable to read Alchemy profile config at ${profilePath}.`,
          error instanceof Error ? error.message : String(error),
        ].join('\n'),
      )
    }
  })()

  if (!profileConfig.profiles?.[profileName]?.Cloudflare) {
    fail(
      [
        `Alchemy profile '${profileName}' does not include Cloudflare credentials.`,
        '',
        'For local deployment, run from the repository root:',
        `  ALCHEMY_PROFILE=${profileName} pnpm infra:login`,
        '',
        'Or use scoped token auth by exporting these variables or adding them to .env:',
        '  CLOUDFLARE_ACCOUNT_ID',
        '  CLOUDFLARE_API_TOKEN',
        '',
        stateStoreReadinessGuidance,
      ].join('\n'),
    )
  }

  if (
    requireStateStore &&
    !stateStoreCredentialsExists(resolvedStateStoreCredentialsPath)
  ) {
    fail(
      [
        `Alchemy profile '${profileName}' is configured, but Cloudflare state store credentials were not found.`,
        '',
        'Alchemy deploys this stack with Cloudflare.state(), so bootstrap the shared state store before planning or deploying:',
        `  ALCHEMY_PROFILE=${profileName} pnpm infra:bootstrap`,
        '',
        stateStoreReadinessGuidance,
      ].join('\n'),
    )
  }

  if (requireStateStore) {
    const stateStoreUrl = readStateStoreUrlFromCredentials(
      readStateStoreCredentials(resolvedStateStoreCredentialsPath),
      resolvedStateStoreCredentialsPath,
    )
    await assertStateStoreVersion({
      expectedVersion: stateStoreExpectedVersion,
      fetchImpl,
      url: stateStoreUrl,
      workerName: stateStoreWorkerName,
    })
  }

  return requireStateStore
    ? `Alchemy Cloudflare profile '${profileName}' and Cloudflare state store are verified.`
    : `Alchemy Cloudflare profile '${profileName}' is configured.`
}

function shouldRequireStateStore() {
  return !process.argv.includes('--auth-only')
}

function isMainModule() {
  const entrypoint = process.argv[1]

  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  )
}

if (isMainModule()) {
  try {
    console.log(
      await checkCloudflareAuth({
        requireStateStore: shouldRequireStateStore(),
      }),
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

/* eslint-disable @typescript-eslint/no-unnecessary-condition -- GitHub CLI output is runtime data */

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')

const requiredSecretNames = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
] as const

const workflowName = 'TanStack Start Cloudflare'
const workflowPath = '.github/workflows/start-cloudflare.yml'
const environmentName = 'cloudflare-dev'

interface WorkflowListItem {
  name?: string
  path?: string
  state?: string
}

interface SecretListItem {
  name?: string
}

interface RepositoryView {
  defaultBranchRef?: {
    name?: string
  }
}

export interface GhResult {
  status: number | null
  stdout?: string
  stderr?: string
  error?: Error
}

export interface CheckCloudflareCiReadinessOptions {
  localWorkflowText?: string
  runGh?: (args: readonly string[]) => GhResult
}

export class CloudflareCiReadinessError extends Error {
  override readonly name = 'CloudflareCiReadinessError'
}

function fail(message: string): never {
  throw new CloudflareCiReadinessError(message)
}

function defaultRunGh(args: readonly string[]): GhResult {
  const result = spawnSync('gh', [...args], {
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

function runGhJson<TValue>(
  runGh: (args: readonly string[]) => GhResult,
  args: readonly string[],
) {
  const result = runGh(args)

  if (result.error) {
    fail(`Unable to run \`gh ${args.join(' ')}\`.\n${result.error.message}`)
  }

  if (result.status !== 0) {
    fail(
      [
        `GitHub CLI command failed: gh ${args.join(' ')}`,
        result.stderr?.trim() ?? result.stdout?.trim() ?? '',
      ]
        .filter((line) => line !== '')
        .join('\n'),
    )
  }

  try {
    return JSON.parse(result.stdout ?? '[]') as TValue
  } catch (error) {
    fail(
      [
        `Unable to parse GitHub CLI JSON output for: gh ${args.join(' ')}`,
        error instanceof Error ? error.message : String(error),
      ].join('\n'),
    )
  }
}

function runGhText(
  runGh: (args: readonly string[]) => GhResult,
  args: readonly string[],
) {
  const result = runGh(args)

  if (result.error) {
    fail(`Unable to run \`gh ${args.join(' ')}\`.\n${result.error.message}`)
  }

  if (result.status !== 0) {
    fail(
      [
        `GitHub CLI command failed: gh ${args.join(' ')}`,
        result.stderr?.trim() ?? result.stdout?.trim() ?? '',
      ]
        .filter((line) => line !== '')
        .join('\n'),
    )
  }

  return result.stdout ?? ''
}

function normalizeWorkflowYaml(value: string) {
  return value.replace(/\r\n/g, '\n').trim()
}

function secretNames(secrets: readonly SecretListItem[]) {
  return new Set(
    secrets
      .map((secret) => secret.name)
      .filter((name): name is string => name !== undefined && name !== ''),
  )
}

function readDefaultBranchName(runGh: (args: readonly string[]) => GhResult) {
  const repository = runGhJson<RepositoryView>(runGh, [
    'repo',
    'view',
    '--json',
    'defaultBranchRef',
  ])

  return repository.defaultBranchRef?.name ?? 'default branch'
}

export function checkCloudflareCiReadiness({
  localWorkflowText = readFileSync(join(repoRoot, workflowPath), 'utf8'),
  runGh = defaultRunGh,
}: CheckCloudflareCiReadinessOptions = {}) {
  const defaultBranchName = readDefaultBranchName(runGh)
  const workflows = runGhJson<WorkflowListItem[]>(runGh, [
    'workflow',
    'list',
    '--all',
    '--json',
    'name,path,state',
  ])
  const workflow = workflows.find(
    (item) => item.name === workflowName || item.path === workflowPath,
  )

  if (workflow === undefined) {
    fail(
      [
        `GitHub Actions workflow '${workflowName}' is not registered on the remote repository.`,
        '',
        `Commit and push ${workflowPath} to the remote default branch (${defaultBranchName}) before running the remote Cloudflare deploy workflow.`,
      ].join('\n'),
    )
  }

  if (workflow.state !== 'active') {
    fail(
      `GitHub Actions workflow '${workflowName}' is registered but not active; current state is ${workflow.state ?? 'unknown'}.`,
    )
  }

  const remoteWorkflowText = runGhText(runGh, [
    'workflow',
    'view',
    workflow.path ?? workflowName,
    '--yaml',
  ])

  if (
    normalizeWorkflowYaml(remoteWorkflowText) !==
    normalizeWorkflowYaml(localWorkflowText)
  ) {
    fail(
      [
        `Remote GitHub Actions workflow '${workflowName}' does not match ${workflowPath} in this working tree.`,
        '',
        `Commit and push the current ${workflowPath} to the remote default branch (${defaultBranchName}) before running the remote Cloudflare deploy workflow.`,
      ].join('\n'),
    )
  }

  const repositorySecrets = secretNames(
    runGhJson<SecretListItem[]>(runGh, [
      'secret',
      'list',
      '--app',
      'actions',
      '--json',
      'name',
    ]),
  )
  const missingRepositorySecrets = requiredSecretNames.filter(
    (name) => !repositorySecrets.has(name),
  )

  if (missingRepositorySecrets.length === 0) {
    return `Cloudflare CI readiness verified: workflow '${workflowName}' is active and repository Actions secrets are configured.`
  }

  const environmentSecretsResult = runGh([
    'secret',
    'list',
    '--app',
    'actions',
    '--env',
    environmentName,
    '--json',
    'name',
  ])

  if (environmentSecretsResult.status !== 0) {
    fail(
      [
        `Cloudflare CI secrets are missing from repository Actions secrets: ${missingRepositorySecrets.join(', ')}.`,
        `Environment '${environmentName}' secrets could not be inspected.`,
        environmentSecretsResult.stderr?.trim() ??
          environmentSecretsResult.stdout?.trim() ??
          '',
      ]
        .filter((line) => line !== '')
        .join('\n'),
    )
  }

  const environmentSecretList = (() => {
    try {
      return JSON.parse(
        environmentSecretsResult.stdout ?? '[]',
      ) as SecretListItem[]
    } catch (error) {
      fail(
        [
          `Unable to parse GitHub CLI JSON output for environment '${environmentName}' secrets.`,
          error instanceof Error ? error.message : String(error),
        ].join('\n'),
      )
    }
  })()
  const environmentSecrets = secretNames(environmentSecretList)
  const missingEnvironmentSecrets = requiredSecretNames.filter(
    (name) => !environmentSecrets.has(name),
  )

  if (missingEnvironmentSecrets.length > 0) {
    fail(
      [
        `Cloudflare CI secrets are missing for the remote workflow: ${missingEnvironmentSecrets.join(', ')}.`,
        `Set them as repository Actions secrets or environment '${environmentName}' secrets before running deploy.`,
      ].join('\n'),
    )
  }

  return `Cloudflare CI readiness verified: workflow '${workflowName}' is active and environment '${environmentName}' secrets are configured.`
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
    console.log(checkCloudflareCiReadiness())
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

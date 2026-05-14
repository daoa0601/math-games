import { describe, expect, it } from 'vitest'

import {
  checkCloudflareCiReadiness,
  CloudflareCiReadinessError,
} from '../checkCloudflareCiReadiness'
import type { GhResult } from '../checkCloudflareCiReadiness'

function ghJson(value: unknown): GhResult {
  return {
    status: 0,
    stdout: JSON.stringify(value),
  }
}

const localWorkflowText = 'name: TanStack Start Cloudflare\n'

function activeWorkflow() {
  return ghJson([
    {
      name: 'TanStack Start Cloudflare',
      path: '.github/workflows/start-cloudflare.yml',
      state: 'active',
    },
  ])
}

function ghText(stdout: string): GhResult {
  return {
    status: 0,
    stdout,
  }
}

function defaultBranch() {
  return ghJson({
    defaultBranchRef: {
      name: 'main',
    },
  })
}

describe('Cloudflare CI readiness preflight', () => {
  it('requires the Cloudflare workflow to be registered remotely', () => {
    expect(() =>
      checkCloudflareCiReadiness({
        runGh: (args) => {
          if (args[0] === 'repo') {
            return defaultBranch()
          }

          return ghJson([{ name: 'Build and Deploy', state: 'active' }])
        },
      }),
    ).toThrow('is not registered')
    expect(() =>
      checkCloudflareCiReadiness({
        runGh: (args) => {
          if (args[0] === 'repo') {
            return defaultBranch()
          }

          return ghJson([{ name: 'Build and Deploy', state: 'active' }])
        },
      }),
    ).toThrow('remote default branch (main)')
  })

  it('requires the Cloudflare workflow to be active', () => {
    expect(() =>
      checkCloudflareCiReadiness({
        runGh: (args) => {
          if (args[0] === 'repo') {
            return defaultBranch()
          }

          return ghJson([
            {
              name: 'TanStack Start Cloudflare',
              path: '.github/workflows/start-cloudflare.yml',
              state: 'disabled_manually',
            },
          ])
        },
      }),
    ).toThrow('not active')
  })

  it('accepts repository Actions secrets', () => {
    const result = checkCloudflareCiReadiness({
      localWorkflowText,
      runGh: (args) => {
        if (args[0] === 'repo') {
          return defaultBranch()
        }

        if (args[0] === 'workflow' && args[1] === 'list') {
          return activeWorkflow()
        }

        if (args[0] === 'workflow' && args[1] === 'view') {
          return ghText(localWorkflowText)
        }

        return ghJson([
          { name: 'CLOUDFLARE_ACCOUNT_ID' },
          { name: 'CLOUDFLARE_API_TOKEN' },
        ])
      },
    })

    expect(result).toContain('repository Actions secrets are configured')
  })

  it('accepts cloudflare-dev environment Actions secrets', () => {
    const result = checkCloudflareCiReadiness({
      localWorkflowText,
      runGh: (args) => {
        if (args[0] === 'repo') {
          return defaultBranch()
        }

        if (args[0] === 'workflow' && args[1] === 'list') {
          return activeWorkflow()
        }

        if (args[0] === 'workflow' && args[1] === 'view') {
          return ghText(localWorkflowText)
        }

        if (args.includes('--env')) {
          return ghJson([
            { name: 'CLOUDFLARE_ACCOUNT_ID' },
            { name: 'CLOUDFLARE_API_TOKEN' },
          ])
        }

        return ghJson([])
      },
    })

    expect(result).toContain("environment 'cloudflare-dev' secrets")
  })

  it('requires the remote workflow yaml to match the local guarded workflow', () => {
    expect(() =>
      checkCloudflareCiReadiness({
        localWorkflowText,
        runGh: (args) => {
          if (args[0] === 'repo') {
            return defaultBranch()
          }

          if (args[0] === 'workflow' && args[1] === 'list') {
            return activeWorkflow()
          }

          if (args[0] === 'workflow' && args[1] === 'view') {
            return ghText('name: stale workflow\n')
          }

          return ghJson([
            { name: 'CLOUDFLARE_ACCOUNT_ID' },
            { name: 'CLOUDFLARE_API_TOKEN' },
          ])
        },
      }),
    ).toThrow('remote default branch (main)')
  })

  it('reports missing Cloudflare secrets', () => {
    expect(() =>
      checkCloudflareCiReadiness({
        localWorkflowText,
        runGh: (args) => {
          if (args[0] === 'repo') {
            return defaultBranch()
          }

          if (args[0] === 'workflow' && args[1] === 'list') {
            return activeWorkflow()
          }

          if (args[0] === 'workflow' && args[1] === 'view') {
            return ghText(localWorkflowText)
          }

          return ghJson([])
        },
      }),
    ).toThrow('Cloudflare CI secrets are missing')
  })

  it('reports unreadable environment secret JSON as a readiness error', () => {
    expect(() =>
      checkCloudflareCiReadiness({
        localWorkflowText,
        runGh: (args) => {
          if (args[0] === 'repo') {
            return defaultBranch()
          }

          if (args[0] === 'workflow' && args[1] === 'list') {
            return activeWorkflow()
          }

          if (args[0] === 'workflow' && args[1] === 'view') {
            return ghText(localWorkflowText)
          }

          if (args.includes('--env')) {
            return ghText('not json')
          }

          return ghJson([])
        },
      }),
    ).toThrow(CloudflareCiReadinessError)
  })

  it('uses a typed readiness error for failures', () => {
    expect(() =>
      checkCloudflareCiReadiness({
        runGh: () => ({
          status: 1,
          stderr: 'not logged in',
        }),
      }),
    ).toThrow(CloudflareCiReadinessError)
  })
})

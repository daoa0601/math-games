// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/.wrangler/**',
      '**/.alchemy/**',
      'apps/web/src/routeTree.gen.ts',
      '**/vitest.config.ts',
      '**/tsup.config.ts',
      '**/vite.config.ts',
      '**/playwright.config.ts',
      '**/eslint.config.js',
    ],
  },
]

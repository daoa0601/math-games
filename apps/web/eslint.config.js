//  @ts-check

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
    files: [
      'src/games/**/*.ts',
      'src/games/**/*.tsx',
      'src/routes/__root.tsx',
      'src/routes/daily.tsx',
      'src/routes/index.tsx',
      'src/routes/games/**/*.tsx',
      'src/shared/utils/**/*.ts',
      'playwright.config.ts',
      'tests/e2e/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },
  {
    ignores: [
      '.alchemy/**',
      '.wrangler/**',
      'dist/**',
      'eslint.config.js',
      'playwright-report/**',
      'prettier.config.js',
      'test-results/**',
      'worker-configuration.d.ts',
    ],
  },
]

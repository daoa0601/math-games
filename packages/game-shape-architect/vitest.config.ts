import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/index.ts', 'src/module.ts', 'src/translations.ts', 'src/rendering/**'],
      thresholds: { lines: 50, functions: 50, branches: 45, statements: 50 },
    },
  },
})

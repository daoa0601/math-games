import viteReact from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'cloudflare:workers': fileURLToPath(
        new URL('./src/test/cloudflare-workers.ts', import.meta.url),
      ),
    },
    tsconfigPaths: true,
  },
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    testTimeout: 5000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/routeTree.gen.ts', 'src/test/**', 'src/**/__tests__/**'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
})

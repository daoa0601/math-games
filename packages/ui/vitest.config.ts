import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    testTimeout: 5000,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})

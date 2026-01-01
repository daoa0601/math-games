import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    // Path aliases matching tsconfig.app.json
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/shared': path.resolve(__dirname, './src/shared'),
            '@/games': path.resolve(__dirname, './src/games'),
            '@/i18n': path.resolve(__dirname, './src/i18n'),
            '@/pages': path.resolve(__dirname, './src/pages'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.test.{ts,tsx}',
                'src/**/__tests__/**',
                'src/test/**',
                'src/main.tsx',
                'src/vite-env.d.ts',
            ],
        },
    },
})

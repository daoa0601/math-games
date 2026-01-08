import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { threeMinifier } from '@yushijinhun/three-minifier-rollup'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Pre-transform frequently used files during dev server startup
  // Eliminates cold-start delays when E2E tests first access game routes
  server: {
    warmup: {
      clientFiles: [
        './src/games/MagicGraph/index.ts',
        './src/games/SequenceRace/index.ts',
        './src/games/ShapeArchitect/index.ts',
      ],
    },
  },
  plugins: [
    // Three.js minifier - removes unused code from three.js bundle
    // Expected reduction: ~40-60% of three.js bundle size
    { ...threeMinifier(), enforce: 'pre' },
    react(),
    // Pre-compress assets for faster serving
    viteCompression({ algorithm: 'gzip' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],
  // Base path: '/math-games/' for production (GitHub Pages), '/' for dev
  base: command === 'build' ? '/math-games/' : '/',
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
  build: {
    // Manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - changes rarely
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // i18n - changes rarely
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // three.js - large, only used by ShapeArchitect (minified by plugin)
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // Firebase - loaded on-demand when Firebase is configured
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // REMOVED: dnd-vendor - now bundles with ShapeArchitect chunk
        },
      },
    },
    // Increase chunk size warning limit (three.js is expected to be large even after minification)
    chunkSizeWarningLimit: 600,
  },
}))

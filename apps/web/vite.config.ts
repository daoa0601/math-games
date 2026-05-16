import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const isAlchemyDeploy = process.env.ALCHEMY_DEPLOY === '1'

const config = defineConfig({
  build: { chunkSizeWarningLimit: 600 },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    ...(!isAlchemyDeploy
      ? [cloudflare({ viteEnvironment: { name: 'ssr' } })]
      : []),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config

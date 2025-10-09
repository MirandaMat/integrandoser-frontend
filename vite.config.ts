// ./vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['integradandoser.share.zrok.io']
  },
  plugins: [react()],
})

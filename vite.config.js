import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: ['favicon.svg', 'icon.svg', 'manifest.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})

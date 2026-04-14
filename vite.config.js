import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: ['favicon.svg', 'logoMealOrganizer.png', 'icon-192.png', 'icon-512.png', 'manifest.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})

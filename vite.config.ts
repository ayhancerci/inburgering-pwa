import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from a GitHub Pages project site: https://ayhancerci.github.io/inburgering-pwa/
const BASE = '/inburgering-pwa/'

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Inburgering — Nederlands A2',
        short_name: 'Inburgering',
        description: 'Studieplan en oefenen voor het Nederlandse inburgeringsexamen (A2).',
        lang: 'nl',
        theme_color: '#facc15',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: BASE + 'index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
})

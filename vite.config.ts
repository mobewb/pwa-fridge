/// <reference types="vitest/config" />
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // HTTPS auto-signé en dev uniquement : la caméra (getUserMedia) exige un contexte
    // sécurisé quand on ouvre l'app depuis un téléphone via l'IP du Mac.
    ...(command === 'serve' ? [basicSsl()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Fridge',
        short_name: 'Fridge',
        description: 'Suivi des produits du frigo pour éviter le gaspillage',
        lang: 'fr',
        theme_color: '#16a34a',
        background_color: '#f6f8f6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Ne jamais mettre l'API en cache dans le service worker : les données
        // hors-ligne viennent de la persistance TanStack Query.
        navigateFallbackDenylist: [/^\/api\//, /^\/docs/, /^\/admin/],
      },
    }),
  ],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
}))

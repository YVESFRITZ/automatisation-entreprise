import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  // Chemins RELATIFS : le build fonctionne quel que soit l'endroit où il est servi
  // (racine d'un domaine, sous-dossier GitHub Pages, tunnel, prévisualisation…).
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Automatisation Entreprise',
        short_name: 'Auto Entreprise',
        description: 'Caisse, prospects et réseaux sociaux — tout automatisé, synchronisé sur vos appareils.',
        lang: 'fr',
        theme_color: '#F5F6F9',
        background_color: '#F5F6F9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  server: {
    port: 5180,
    host: true,
  },
}))

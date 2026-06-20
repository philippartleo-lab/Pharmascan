import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Le proxy /api renvoie vers le petit back-end (server/index.js) en développement.
// C'est lui qui interroge les sources officielles : il règle le CORS et centralise
// les appels (BDPM, Open Beauty Facts, Open Prices, communes, OpenStreetMap…).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Pharmascan',
        short_name: 'Pharmascan',
        description: 'Identifier un médicament, un produit de parapharmacie, trouver une pharmacie de garde.',
        theme_color: '#0F6E56',
        background_color: '#F4F6F4',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8787'
    }
  }
});

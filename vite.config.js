import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// En production sur Vercel, les routes /api/* sont gérées par les fonctions
// serverless dans le dossier /api. En développement local, le proxy renvoie
// vers le serveur Express (server/index.js) lancé via `npm start`.
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

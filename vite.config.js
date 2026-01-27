import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mi Vida Organizada',
        short_name: 'MiVida',
        description: 'App de seguimiento de hábitos y rutina diaria',
        theme_color: '#171717',
        background_color: '#171717',
        display: 'standalone', // Esto quita la barra del navegador
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // Vite generará esto si tienes el logo, si no usará uno por defecto
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
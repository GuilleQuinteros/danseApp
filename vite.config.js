import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
  registerType: 'autoUpdate',

  manifest: {
    name: 'Danse Studio',
    short_name: 'Danse',
    description: 'Sistema de gestión Danse Studio',
    theme_color: '#0f766e',
    background_color: '#ffffff',
    display: 'standalone',

    icons: [
      {
        src: '/pwa-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/pwa-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }
})],         
  server: {
    port: 3000
  }
})

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Secure User Sync App',
        short_name: 'UserSync',
        description: 'A secure Vue 3 app with user synchronization and offline capabilities',
        theme_color: '#1976D2',
        icons: [
          {
            src: 'icons/Vue.js_Logo_2.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/Vue.js_Logo_2.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://calls.trolley.systems',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ]
});
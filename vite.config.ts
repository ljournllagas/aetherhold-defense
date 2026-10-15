import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  test:{maxWorkers:2},
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Phaser changes rarely: a separate chunk stays cached across game-code deploys.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } }
    }
  },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'screenshots/*.png'],
      manifest: {
        name: 'Aegis of the Borderkeep',
        short_name: 'Aegis TD',
        description: 'Aegis of the Borderkeep: defend the Ancient Border Keep from the Gloomtide in an original fantasy tower defense.',
        start_url: '/?utm_source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0A0E12',
        theme_color: '#0A0E12',
        dir: 'ltr',
        lang: 'en',
        categories: ['games', 'entertainment'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
          { src: 'screenshots/desktop-1280x720.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide', label: 'Defend the pass on desktop' },
          { src: 'screenshots/mobile-540x720.png', sizes: '540x720', type: 'image/png', form_factor: 'narrow', label: 'Command the keep on mobile' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Shell bundle is ~2.2MB (Phaser); allow precache above default 2MiB.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Shell only: JS/CSS/HTML/fonts. Game art (~295MB) is runtime-cached
        // per level on demand (Q9) instead of precached upfront.
        globPatterns: ['**/*.{js,css,html,woff2}'],
        // woff2 is universal; the .woff twins and non-Latin subsets would only inflate first install.
        globIgnores: ['**/*-cyrillic*', '**/*-greek*', '**/*-vietnamese*'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-art',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly'
          }
        ],
        skipWaiting: false,
        clientsClaim: false
      }
    })
  ]
});

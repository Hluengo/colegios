import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Configuración optimizada de Vite para producción con PWA
 */
export default defineConfig({
  plugins: [
    react(),
    // PWA Configuration para funcionamiento offline
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'robots.txt', 'branding/*.png'],
      manifest: {
        name: 'Convivencia Escolar',
        short_name: 'Convivencia',
        description: 'Sistema de gestión de casos de convivencia escolar',
        theme_color: '#0b1220',
        background_color: '#f6f7f8',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Archivos a cachear para offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching para API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Supabase API caching
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    strictPort: true,
    port: 5173,
  },
  build: {
    // Target moderno para mejor tree-shaking
    target: 'esnext',
    // Minificador optimizado
    minify: 'esbuild',
    // Generar sourcemap solo en desarrollo
    sourcemap: false,
    // Chunk size warning elevado por libraries pesadas
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Code splitting optimizado
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['@react-pdf/renderer'],
          'vendor-icons': ['lucide-react'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
    // Configuración de CSS
    cssCodeSplit: true,
    // Optimizaciones de assets
    assetsInlineLimit: 4096,
  },
  esbuild: {
    // Eliminar comentarios legales para reducir tamaño
    legalComments: 'none',
  },
  // Optimizaciones de resolve
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Headers para caché
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
});

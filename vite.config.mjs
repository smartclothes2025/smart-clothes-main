// vite.config.mjs
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_TARGET = 'https://cometical-kyphotic-deborah.ngrok-free.dev'

  console.log('🔧 Vite Proxy Config:')
  console.log('  API_TARGET:', API_TARGET)
  console.log('  Mode:', mode)
  console.log('  env.VITE_API_TARGET:', env.VITE_API_TARGET)

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['/icons/favicon.ico'],
        manifest: {
          name: 'SmartCloset',          // 顯示於安裝後名稱
          short_name: 'Closet',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#111827',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          // （可選）加捷徑
          shortcuts: [
            { name: '上傳衣物', short_name: '上傳', url: '/upload' },
            { name: '衣櫃', short_name: '衣櫃', url: '/wardrobe' },
          ],
        },
      }),
    ],
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['smartcloset.ngrok.dev'],
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => {
            console.log('📍 Proxy rewrite:', path, '->', path)
            return path
          },
        },
        '/uploads': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

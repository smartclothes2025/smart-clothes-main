// vite.config.mjs
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_TARGET = 'https://cometical-kyphotic-deborah.ngrok-free.dev'

  console.log('🔧 Vite Proxy Config:')
  console.log('  API_TARGET:', API_TARGET)
  console.log('  Mode:', mode)
  console.log('  env.VITE_API_TARGET:', env.VITE_API_TARGET)

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: [
        'smartcloset.ngrok.dev' // ✅ 加這行
      ],
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

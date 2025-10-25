// vite.config.mjs
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 直接硬編碼，確保使用正確的端口
  const API_TARGET = 'http://localhost:8000'

  console.log('🔧 Vite Proxy Config:')
  console.log('  API_TARGET:', API_TARGET)
  console.log('  Mode:', mode)
  console.log('  env.VITE_API_TARGET:', env.VITE_API_TARGET)

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
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
        // 讓圖片資源如 /uploads/... 能透過代理到後端 8000
        '/uploads': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

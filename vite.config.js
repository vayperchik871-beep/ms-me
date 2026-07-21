import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || env.API_TARGET || 'http://localhost:3001'
  const wsTarget = env.VITE_WS_TARGET || apiTarget.replace(/^http/, 'ws')
  const isAdmin = env.VITE_ADMIN_MODE === 'true'

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main: isAdmin ? 'admin.html' : 'index.html',
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        '/ws': { target: wsTarget, ws: true, changeOrigin: true, secure: false },
      },
    },
  }
})

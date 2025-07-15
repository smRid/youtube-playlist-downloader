import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: command === 'serve' 
          ? 'http://localhost:5000' 
          : 'https://yt-playlist-downloader-server.vercel.app',
        changeOrigin: true,
        secure: command !== 'serve',
      },
    },
  },
}))

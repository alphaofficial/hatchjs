import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: {
        app: './src/client/app.tsx'
      }
    },
    manifest: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
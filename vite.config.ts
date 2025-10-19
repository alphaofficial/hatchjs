import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    build: {
      emptyOutDir: false,
      sourcemap: true,
      outDir: 'public',
      rollupOptions: {
        input: resolve(__dirname, 'src/views/main.tsx'),
        output: {
          entryFileNames: 'app.js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          dir: 'public',
          manualChunks: undefined,
        }
      }
    },
    mode: mode,
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
  }
})
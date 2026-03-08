import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 設定：開發伺服器 + Vitest 測試環境
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})

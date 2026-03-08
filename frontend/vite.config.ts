import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vite 設定：開發伺服器 + Vitest 測試環境
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // 排除 Playwright e2e 測試，避免 Vitest 誤抓執行
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})

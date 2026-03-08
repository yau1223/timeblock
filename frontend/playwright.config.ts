// Playwright E2E 測試設定
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // 每個測試最多等待 45 秒（遠端服務可能較慢）
  timeout: 45000,
  // 最多重試 2 次，減少因網路波動造成的誤判
  retries: 2,
  // 並行度設為 1，避免測試帳號衝突
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    // 直接測試部署在 Vercel 的前端（含 Vercel Rewrite 代理後端）
    baseURL: 'https://timeblock-alpha.vercel.app',
    // 測試失敗時擷取截圖
    screenshot: 'only-on-failure',
    // 測試失敗時保留錄影
    video: 'retain-on-failure',
    // 第一次重試時收集 trace 以便除錯
    trace: 'on-first-retry',
    headless: true,
    // 等待網路請求完成後再做斷言
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 測試遠端服務時不需要啟動本機伺服器
})

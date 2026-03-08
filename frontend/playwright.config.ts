// Playwright E2E 測試設定
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // 每個測試最多等待 30 秒
  timeout: 30000,
  // CI 環境不重試，本地重試 1 次
  retries: process.env.CI ? 0 : 1,
  use: {
    baseURL: 'http://localhost:5173',
    // 測試失敗時擷取截圖
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 自動啟動前端開發伺服器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})

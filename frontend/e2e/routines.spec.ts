// 例行事項頁面 E2E 測試：頁面載入、新增 Modal 開啟
import { test, expect } from '@playwright/test'

// Render 免費方案冷啟動需要 50-60 秒，涉及 API 的操作需要較長 timeout
const API_TIMEOUT = 60000

// 共用登入帳號：使用固定測試帳號，避免每次測試都需要重新註冊
const TEST_EMAIL = `e2e-routines-${Date.now()}@test.com`
const TEST_PASSWORD = 'password123'

test.describe('例行事項頁面', () => {
  // 在所有測試執行前，先建立測試帳號
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('https://timeblock-alpha.vercel.app/login')
    // 切換至註冊模式
    await page.click('text=立即註冊')
    await page.fill('input[placeholder="你的名字"]', '例行事項測試帳號')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    // 等待跳轉至日視圖，確認帳號建立成功
    await page.waitForURL(/\/day/, { timeout: API_TIMEOUT })
    await page.close()
  })

  // 每個測試前都先完成登入流程
  test.beforeEach(async ({ page }) => {
    // 導航至登入頁
    await page.goto('/login')
    // 填入測試帳號的帳密
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    // 點擊登入按鈕
    await page.click('button[type="submit"]')
    // 等待跳轉至 /day，確認登入成功
    await expect(page).toHaveURL(/\/day/, { timeout: API_TIMEOUT })
  })

  test('例行事項頁面可正常開啟', async ({ page }) => {
    // 導航至例行事項頁面
    await page.goto('/routines')
    // 頁面應顯示「例行事項」標題
    await expect(page.locator('h2:has-text("例行事項")')).toBeVisible()
  })

  test('顯示新增按鈕', async ({ page }) => {
    // 導航至例行事項頁面
    await page.goto('/routines')
    // 頁面應顯示包含「新增」文字的按鈕
    await expect(page.getByRole('button', { name: /新增/ })).toBeVisible()
  })

  test('點擊新增開啟 Modal', async ({ page }) => {
    // 導航至例行事項頁面
    await page.goto('/routines')
    // 點擊新增按鈕
    await page.getByRole('button', { name: /新增/ }).click()
    // Modal 應顯示「新增例行事項」標題
    await expect(page.getByText('新增例行事項')).toBeVisible()
  })
})

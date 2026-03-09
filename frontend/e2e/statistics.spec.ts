// 統計頁面 E2E 測試：頁面載入、統計範圍切換
import { test, expect } from '@playwright/test'

// Render 免費方案冷啟動需要 50-60 秒，涉及 API 的操作需要較長 timeout
const API_TIMEOUT = 60000

// 共用登入帳號：使用固定測試帳號，避免每次測試都需要重新註冊
const TEST_EMAIL = `e2e-statistics-${Date.now()}@test.com`
const TEST_PASSWORD = 'password123'

test.describe('統計頁面', () => {
  // 在所有測試執行前，先建立測試帳號
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('https://timeblock-alpha.vercel.app/login')
    // 切換至註冊模式
    await page.click('text=立即註冊')
    await page.fill('input[placeholder="你的名字"]', '統計測試帳號')
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

  test('統計頁面可正常開啟', async ({ page }) => {
    // 導航至統計頁面
    await page.goto('/statistics')
    // 頁面應同時顯示「時間分配」與「習慣完成率」兩個區塊標題
    await expect(page.locator('h3:has-text("時間分配")')).toBeVisible()
    await expect(page.locator('h3:has-text("習慣完成率")')).toBeVisible()
  })

  test('切換統計範圍至月', async ({ page }) => {
    // 導航至統計頁面
    await page.goto('/statistics')
    // 點擊「月」切換按鈕
    await page.getByRole('button', { name: '月' }).click()
    // 月份按鈕應顯示選中狀態（包含 bg-white class）
    await expect(page.getByRole('button', { name: '月' })).toHaveClass(/bg-white/)
  })

  test('切換統計範圍至日', async ({ page }) => {
    // 導航至統計頁面
    await page.goto('/statistics')
    // 先切換至月，再切回日，驗證切換功能正常運作
    await page.getByRole('button', { name: '月' }).click()
    await page.getByRole('button', { name: '日' }).click()
    // 日份按鈕應顯示選中狀態（包含 bg-white class）
    await expect(page.getByRole('button', { name: '日' })).toHaveClass(/bg-white/)
  })
})

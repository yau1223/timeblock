// 認證流程 E2E 測試：註冊、登入、錯誤訊息顯示
import { test, expect } from '@playwright/test'

// 產生唯一 email 避免測試間衝突
const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`

test.describe('認證流程', () => {
  test('訪問受保護頁面時應跳轉至登入頁', async ({ page }) => {
    await page.goto('/day')
    await expect(page).toHaveURL(/\/login/)
  })

  test('使用 Email 完成完整的註冊流程', async ({ page }) => {
    await page.goto('/login')

    // 切換至註冊模式（按鈕文字包含「立即註冊」）
    await page.click('text=立即註冊')
    await expect(page.locator('input[placeholder="你的名字"]')).toBeVisible()

    // 填寫並提交註冊表單
    await page.fill('input[placeholder="你的名字"]', 'E2E 測試使用者')
    await page.fill('input[type="email"]', uniqueEmail())
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 成功後跳轉至日視圖
    await expect(page).toHaveURL(/\/day/, { timeout: 10000 })
  })

  test('錯誤密碼應顯示錯誤訊息', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexist@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // 應顯示後端回傳的錯誤訊息
    await expect(page.locator('text=帳號或密碼錯誤')).toBeVisible({ timeout: 5000 })
  })
})

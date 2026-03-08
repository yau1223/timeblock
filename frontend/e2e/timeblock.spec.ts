// 時間塊功能 E2E 測試
import { test, expect, type Page } from '@playwright/test'

/** 建立並登入測試帳號 */
async function loginAsTestUser(page: Page) {
  const email = `e2e-block-${Date.now()}@test.com`

  // 先註冊
  await page.goto('/login')
  await page.click('text=立即註冊')
  await page.fill('input[placeholder="你的名字"]', '時間塊測試')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/day/, { timeout: 10000 })
}

test.describe('時間塊功能', () => {
  test('登入後應顯示日視圖', async ({ page }) => {
    await loginAsTestUser(page)
    await expect(page).toHaveURL(/\/day/)
    // 導覽列應顯示「習慣」連結
    await expect(page.locator('a[href="/habits"]')).toBeVisible()
  })

  test('可以切換至週視圖', async ({ page }) => {
    await loginAsTestUser(page)
    await page.click('a[href="/week"]')
    await expect(page).toHaveURL(/\/week/)
  })

  test('可以切換至月視圖', async ({ page }) => {
    await loginAsTestUser(page)
    await page.click('a[href="/month"]')
    await expect(page).toHaveURL(/\/month/)
  })
})

// 習慣追蹤功能 E2E 測試
import { test, expect, type Page } from '@playwright/test'

/** 建立並登入測試帳號，導覽至習慣頁 */
async function loginAndGoHabits(page: Page) {
  const email = `e2e-habit-${Date.now()}@test.com`

  await page.goto('/login')
  await page.click('text=立即註冊')
  await page.fill('input[placeholder="你的名字"]', '習慣測試')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/day/, { timeout: 10000 })

  // 導覽至習慣頁
  await page.click('a[href="/habits"]')
  await expect(page).toHaveURL(/\/habits/)
}

test.describe('習慣追蹤功能', () => {
  test('空狀態應顯示引導訊息', async ({ page }) => {
    await loginAndGoHabits(page)
    await expect(page.locator('text=還沒有習慣')).toBeVisible()
  })

  test('可以新增習慣', async ({ page }) => {
    await loginAndGoHabits(page)

    // 點擊頁面標頭的「+ 新增習慣」按鈕開啟 Modal
    await page.click('button:has-text("+ 新增習慣")')

    // 等待 Modal 出現
    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible()
    await expect(modal.locator('h3:has-text("新增習慣")')).toBeVisible()

    // 在 Modal 內填入習慣名稱
    await modal.locator('input[placeholder*="習慣名稱"]').fill('晨跑')

    // 點擊 Modal 內的藍色「新增」按鈕（非「取消」按鈕）
    await modal.locator('button.bg-indigo-600').click()

    // 習慣應出現在列表
    await expect(page.locator('text=晨跑')).toBeVisible({ timeout: 5000 })
  })
})

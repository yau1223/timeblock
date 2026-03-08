// 習慣追蹤功能 E2E 測試：新增習慣、標記完成
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
  await page.waitForURL(/\/day/, { timeout: 15000 })

  // 導覽至習慣頁
  await page.click('a[href="/habits"]')
  await expect(page).toHaveURL(/\/habits/, { timeout: 10000 })
}

test.describe('習慣追蹤功能', () => {
  test('習慣頁應顯示標頭與「+ 新增習慣」按鈕', async ({ page }) => {
    await loginAndGoHabits(page)
    await expect(page.locator('h2:has-text("今日習慣")')).toBeVisible()
    await expect(page.locator('button:has-text("+ 新增習慣")')).toBeVisible()
  })

  test('空狀態應顯示引導訊息', async ({ page }) => {
    await loginAndGoHabits(page)
    await expect(page.locator('text=還沒有習慣')).toBeVisible()
  })

  test('可以新增習慣', async ({ page }) => {
    await loginAndGoHabits(page)

    // 點擊「+ 新增習慣」按鈕開啟 Modal
    await page.click('button:has-text("+ 新增習慣")')

    // 等待 Modal 出現
    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible()
    await expect(modal.locator('h3:has-text("新增習慣")')).toBeVisible()

    // 在 Modal 內填入習慣名稱
    const habitName = `晨跑-${Date.now()}`
    await modal.locator('input[placeholder*="習慣名稱"]').fill(habitName)

    // 點擊 Modal 內的「新增」按鈕
    await modal.locator('button:has-text("新增")').first().click()

    // Modal 應關閉
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    // 習慣應出現在列表
    await expect(page.locator(`text=${habitName}`)).toBeVisible({ timeout: 10000 })
  })

  test('新增習慣後可以標記為完成', async ({ page }) => {
    await loginAndGoHabits(page)

    // 新增習慣
    await page.click('button:has-text("+ 新增習慣")')
    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible()

    const habitName = `冥想-${Date.now()}`
    await modal.locator('input[placeholder*="習慣名稱"]').fill(habitName)
    await modal.locator('button:has-text("新增")').first().click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    // 等待習慣出現在列表
    await expect(page.locator(`text=${habitName}`)).toBeVisible({ timeout: 10000 })

    // 直接用 aria-label 找到打勾按鈕（此頁只有一個習慣，按鈕唯一）
    const toggleBtn = page.locator('button[aria-label="標記為完成"]')
    await expect(toggleBtn).toBeVisible({ timeout: 5000 })
    await toggleBtn.click()

    // 按鈕應變為已完成狀態（aria-label 改為「取消完成」）
    await expect(page.locator('button[aria-label="取消完成"]')).toBeVisible({ timeout: 10000 })

    // 習慣名稱應出現刪除線（done 狀態的 CSS class）
    await expect(page.locator('.line-through')).toBeVisible()
  })

  test('新增習慣 Modal 可以取消', async ({ page }) => {
    await loginAndGoHabits(page)

    await page.click('button:has-text("+ 新增習慣")')
    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible()

    // 點擊取消
    await modal.locator('button:has-text("取消")').click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  test('可以使用 Enter 鍵提交新增習慣', async ({ page }) => {
    await loginAndGoHabits(page)

    await page.click('button:has-text("+ 新增習慣")')
    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible()

    const habitName = `跑步-${Date.now()}`
    const input = modal.locator('input[placeholder*="習慣名稱"]')
    await input.fill(habitName)
    await input.press('Enter')

    await expect(modal).not.toBeVisible({ timeout: 5000 })
    await expect(page.locator(`text=${habitName}`)).toBeVisible({ timeout: 10000 })
  })
})

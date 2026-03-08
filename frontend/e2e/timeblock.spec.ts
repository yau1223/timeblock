// 時間塊功能 E2E 測試：日視圖、週/月切換、新增時間塊
import { test, expect, type Page } from '@playwright/test'

/** 建立並登入測試帳號，返回日視圖 */
async function loginAsTestUser(page: Page) {
  const email = `e2e-block-${Date.now()}@test.com`

  await page.goto('/login')
  await page.click('text=立即註冊')
  await page.fill('input[placeholder="你的名字"]', '時間塊測試')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/day/, { timeout: 15000 })
}

test.describe('時間塊功能', () => {
  test('登入後應顯示日視圖與完整導覽列', async ({ page }) => {
    await loginAsTestUser(page)
    await expect(page).toHaveURL(/\/day/)
    // 導覽列四個連結都應存在
    await expect(page.locator('a[href="/day"]')).toBeVisible()
    await expect(page.locator('a[href="/week"]')).toBeVisible()
    await expect(page.locator('a[href="/month"]')).toBeVisible()
    await expect(page.locator('a[href="/habits"]')).toBeVisible()
  })

  test('應顯示 24 小時時間軸', async ({ page }) => {
    await loginAsTestUser(page)
    // 時間軸應顯示 00:00 與 23:00
    await expect(page.locator('text=00:00').first()).toBeVisible()
    await expect(page.locator('text=23:00').first()).toBeVisible()
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

  test('可以新增時間塊', async ({ page }) => {
    await loginAsTestUser(page)

    // 等待時間軸完全渲染：00:00 標籤出現表示 TimeAxis 已掛載
    await expect(page.locator('text=00:00').first()).toBeVisible({ timeout: 15000 })

    // 等待所有 API 網路請求完成，後端（Render 免費方案）可能有冷啟動延遲
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

    // 使用 Playwright locator.click() 而非 mouse.click()：
    // 能自動處理滾動、等待元素可見與穩定，避免 DOM 重渲染期間點到錯誤元素
    // 找 02:00 這一格的 border-t 格線 div 並點擊
    const hourCell = page.locator('.absolute.w-full.border-t').nth(2)  // 第 3 個格線 = 02:00
    await expect(hourCell).toBeVisible({ timeout: 5000 })
    await hourCell.click({ position: { x: 200, y: 32 } })

    // 新增時間塊 Modal 應出現
    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.locator('h2:has-text("新增時間塊")')).toBeVisible()

    // 填入標題
    await modal.locator('input[placeholder="標題（選填）"]').fill('晨間工作')

    // 點擊新增按鈕
    await modal.locator('button:has-text("新增")').click()

    // Modal 應關閉
    await expect(modal).not.toBeVisible({ timeout: 8000 })

    // 時間塊標題應出現在頁面（新建後自動刷新）
    await expect(page.locator('text=晨間工作')).toBeVisible({ timeout: 15000 })
  })

  test('新增時間塊 Modal 可以取消', async ({ page }) => {
    await loginAsTestUser(page)
    await expect(page.locator('text=00:00').first()).toBeVisible({ timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

    const hourCell = page.locator('.absolute.w-full.border-t').nth(3)  // 03:00
    await expect(hourCell).toBeVisible({ timeout: 5000 })
    await hourCell.click({ position: { x: 200, y: 32 } })

    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible({ timeout: 8000 })

    // 點擊取消
    await modal.locator('button:has-text("取消")').click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })
})

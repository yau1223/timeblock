// 進階功能 E2E 測試：色塊、習慣側邊欄、每日進度條、範本頁面
import { test, expect, type Page } from '@playwright/test'

/** 建立並登入測試帳號，返回日視圖 */
async function loginAndGoDay(page: Page) {
  const email = `e2e-enhanced-${Date.now()}@test.com`
  await page.goto('/login')
  await page.click('text=立即註冊')
  await page.fill('input[placeholder="你的名字"]', 'Enhanced 測試')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/day/, { timeout: 60000 })
  // 等待頁面穩定
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
}

test.describe('並排佈局', () => {
  test('日視圖應顯示習慣側邊欄與時間軸並排', async ({ page }) => {
    await loginAndGoDay(page)
    // 習慣側邊欄標題（HabitSidebar 的 h3 顯示「習慣」）
    await expect(page.locator('h3:has-text("習慣")')).toBeVisible({ timeout: 10000 })
    // 時間軸應存在（00:00 標籤）
    await expect(page.locator('text=00:00').first()).toBeVisible()
  })

  test('每日進度條應顯示已排時數', async ({ page }) => {
    await loginAndGoDay(page)
    // DailyProgress 元件顯示「已排 X.Xh」
    await expect(page.locator('text=已排').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('色塊與顏色選擇器', () => {
  test('新增時間塊 Modal 應顯示顏色選擇器', async ({ page }) => {
    await loginAndGoDay(page)
    await expect(page.locator('text=00:00').first()).toBeVisible({ timeout: 15000 })

    // 點擊時間軸某小時格，觸發 modal
    const hourCell = page.locator('.absolute.w-full.border-t').nth(8)  // 08:00
    await expect(hourCell).toBeVisible({ timeout: 5000 })
    await hourCell.click({ position: { x: 200, y: 32 } })

    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible({ timeout: 8000 })
    // 顏色選擇器應在 modal 中（含「顏色」文字）
    await expect(modal.locator('text=顏色')).toBeVisible()
    // 應有顏色按鈕（ColorPicker role=radiogroup）
    await expect(modal.locator('[role="radiogroup"]')).toBeVisible()

    // 取消
    await modal.locator('button:has-text("取消")').click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  test('可以選擇不同顏色並新增時間塊', async ({ page }) => {
    await loginAndGoDay(page)
    await expect(page.locator('text=00:00').first()).toBeVisible({ timeout: 15000 })

    const hourCell = page.locator('.absolute.w-full.border-t').nth(9)  // 09:00
    await expect(hourCell).toBeVisible({ timeout: 5000 })
    await hourCell.click({ position: { x: 200, y: 32 } })

    const modal = page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible({ timeout: 8000 })

    // 填入標題
    await modal.locator('input[placeholder="標題（選填）"]').fill('彩色會議')

    // 點擊第二個顏色按鈕（非預設顏色）
    const colorButtons = modal.locator('[role="radiogroup"] button')
    await expect(colorButtons.nth(1)).toBeVisible()
    await colorButtons.nth(1).click()

    // 新增
    await modal.locator('button:has-text("新增")').click()
    await expect(modal).not.toBeVisible({ timeout: 8000 })

    // 時間塊應出現
    await expect(page.locator('text=彩色會議')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('範本頁面', () => {
  test('導覽至範本頁面應顯示標題', async ({ page }) => {
    await loginAndGoDay(page)
    // 點擊「範本」連結
    await page.click('a[href="/templates"]')
    await expect(page).toHaveURL(/\/templates/, { timeout: 10000 })
    // 應顯示頁面標題（TemplatesPage h2 顯示「排程範本」）
    await expect(page.locator('h2:has-text("排程範本")')).toBeVisible({ timeout: 10000 })
  })

  test('空範本狀態應顯示引導文字', async ({ page }) => {
    await loginAndGoDay(page)
    await page.click('a[href="/templates"]')
    await expect(page).toHaveURL(/\/templates/, { timeout: 10000 })
    // 沒有範本時應顯示「還沒有範本」
    await expect(page.locator('text=還沒有範本')).toBeVisible({ timeout: 10000 })
  })

  test('習慣側邊欄應有「+ 新增習慣」', async ({ page }) => {
    await loginAndGoDay(page)
    // 側邊欄習慣新增按鈕
    await expect(page.locator('button:has-text("+ 新增習慣")')).toBeVisible({ timeout: 10000 })
  })
})

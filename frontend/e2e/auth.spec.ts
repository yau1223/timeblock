// 認證流程 E2E 測試：頁面載入、註冊、登入、錯誤處理
import { test, expect } from '@playwright/test'

// 產生唯一 email 避免測試間衝突
const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`

test.describe('頁面載入', () => {
  test('首頁應正確載入並重新導向至登入頁', async ({ page }) => {
    await page.goto('/')
    // 應自動重新導向至登入頁（受保護路由）
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
    // 登入頁標題應顯示
    await expect(page.locator('h1')).toContainText('TimeBlock')
  })

  test('登入頁應包含所有必要 UI 元素', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('TimeBlock')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('登入')
    // 切換至註冊的連結
    await expect(page.locator('text=立即註冊')).toBeVisible()
  })

  test('訪問受保護頁面時應跳轉至登入頁', async ({ page }) => {
    await page.goto('/day')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('使用者註冊', () => {
  test('使用 Email 完成完整的註冊流程', async ({ page }) => {
    await page.goto('/login')

    // 切換至註冊模式
    await page.click('text=立即註冊')
    await expect(page.locator('input[placeholder="你的名字"]')).toBeVisible()

    // 填寫並提交註冊表單
    const email = uniqueEmail()
    await page.fill('input[placeholder="你的名字"]', 'E2E 測試使用者')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 成功後跳轉至日視圖
    await expect(page).toHaveURL(/\/day/, { timeout: 15000 })
    // 日視圖應顯示導覽列
    await expect(page.locator('a[href="/habits"]')).toBeVisible()
  })

  test('切換至註冊模式時應顯示名稱欄位', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=立即註冊')
    await expect(page.locator('input[placeholder="你的名字"]')).toBeVisible()
    // 提交按鈕文字應改為「建立帳號」
    await expect(page.locator('button[type="submit"]')).toContainText('建立帳號')
  })
})

test.describe('使用者登入', () => {
  // 預先建立一個供登入測試使用的帳號
  const testEmail = `e2e-login-${Date.now()}@test.com`
  const testPassword = 'password123'

  test.beforeAll(async ({ browser }) => {
    // 先用新分頁完成一次註冊，建立帳號
    const page = await browser.newPage()
    await page.goto('https://timeblock-alpha.vercel.app/login')
    await page.click('text=立即註冊')
    await page.fill('input[placeholder="你的名字"]', '登入測試帳號')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/day/, { timeout: 15000 })
    await page.close()
  })

  test('使用正確帳密登入成功', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/day/, { timeout: 15000 })
    // 日視圖應顯示
    await expect(page.locator('a[href="/habits"]')).toBeVisible()
  })

  test('錯誤密碼應顯示錯誤訊息', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexist@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // 應顯示後端回傳的錯誤訊息
    await expect(page.locator('text=帳號或密碼錯誤')).toBeVisible({ timeout: 10000 })
  })
})

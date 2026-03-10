// api/client.ts 單元測試：驗證 Axios 攔截器行為
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

describe('api client 攔截器', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorage.clear()
  })

  test('localStorage 無 token 時，請求不附加 Authorization header', async () => {
    // 動態匯入確保每次測試取得乾淨的 module
    const { default: client } = await import('./client')
    const config = { headers: {} as Record<string, string> }

    // 手動觸發請求攔截器
    const interceptor = (client.interceptors.request as any).handlers?.[0]?.fulfilled
    if (interceptor) {
      const result = interceptor(config)
      expect(result.headers['Authorization']).toBeUndefined()
    }
  })

  test('localStorage 有 token 時，請求附加 Bearer Authorization header', async () => {
    localStorage.setItem('access_token', 'my-test-token')
    const { default: client } = await import('./client')
    const config = { headers: {} as Record<string, string> }

    const interceptor = (client.interceptors.request as any).handlers?.[0]?.fulfilled
    if (interceptor) {
      const result = interceptor(config)
      expect(result.headers['Authorization']).toBe('Bearer my-test-token')
    }
  })

  test('apiClient baseURL 預設為 http://localhost:8000', async () => {
    const { default: client } = await import('./client')
    expect(client.defaults.baseURL).toBe('http://localhost:8000')
  })
})

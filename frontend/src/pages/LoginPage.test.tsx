// LoginPage 單元測試：驗證登入/註冊表單切換與提交行為
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

// mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// mock auth API
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
}))

// mock authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: any) => any) =>
    selector({ setAuth: vi.fn() }),
}))

import { login, getMe } from '../api/auth'

/** 渲染含路由的 LoginPage */
const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('初始狀態顯示登入表單', () => {
    renderPage()
    expect(screen.getByText('歡迎回來')).toBeInTheDocument()
    expect(screen.getByText('請登入您的帳號')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    // 名稱欄位不應出現（登入模式）
    expect(screen.queryByPlaceholderText('你的名字')).not.toBeInTheDocument()
  })

  test('點擊切換連結切換至註冊模式', () => {
    renderPage()

    fireEvent.click(screen.getByText('還沒有帳號？立即註冊'))

    // 使用 heading 選擇器確保選到 h2，避免與按鈕文字衝突
    expect(screen.getByRole('heading', { name: '建立帳號' })).toBeInTheDocument()
    expect(screen.getByText('開始管理您的時間')).toBeInTheDocument()
    // 名稱欄位應出現（註冊模式）
    expect(screen.getByPlaceholderText('你的名字')).toBeInTheDocument()
  })

  test('登入成功後導向 /day', async () => {
    vi.mocked(login).mockResolvedValue({ access_token: 'test-token', token_type: 'bearer' })
    vi.mocked(getMe).mockResolvedValue({
      id: 'u-1',
      email: 'user@test.com',
      name: '測試使用者',
      auth_provider: 'email',
    })

    renderPage()

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })

    fireEvent.submit(screen.getByRole('button', { name: '登入' }).closest('form')!)

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@test.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/day')
    })
  })

  test('登入失敗時顯示錯誤訊息', async () => {
    vi.mocked(login).mockRejectedValue({
      response: { data: { detail: '帳號或密碼錯誤' } },
    })

    renderPage()

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'bad@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong' },
    })

    fireEvent.submit(screen.getByRole('button', { name: '登入' }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('帳號或密碼錯誤')).toBeInTheDocument()
    })
  })

  test('網路異常時顯示通用錯誤訊息', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Network Error'))

    renderPage()

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password' },
    })

    fireEvent.submit(screen.getByRole('button', { name: '登入' }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('網路連線異常，請稍後再試')).toBeInTheDocument()
    })
  })

  test('TimeBlock Logo 顯示', () => {
    renderPage()
    expect(screen.getByText('TimeBlock')).toBeInTheDocument()
  })
})

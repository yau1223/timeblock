// AppLayout 與 Sidebar 元件測試：驗證佈局結構與導覽連結
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AppLayout from './AppLayout'

// mock authStore，提供使用者資訊（Sidebar 使用 useAuthStore() 無 selector）
const mockLogout = vi.fn()
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u-1', email: 'test@test.com', name: '測試使用者', auth_provider: 'email' },
    logout: mockLogout,
  }),
}))

// mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('AppLayout', () => {
  test('渲染 Sidebar 與子元件', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>主內容區</div>
        </AppLayout>
      </MemoryRouter>
    )

    expect(screen.getByText('TimeBlock')).toBeInTheDocument()
    expect(screen.getByText('主內容區')).toBeInTheDocument()
  })

  test('Sidebar 顯示所有導覽連結', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div />
        </AppLayout>
      </MemoryRouter>
    )

    expect(screen.getByText('日視圖')).toBeInTheDocument()
    expect(screen.getByText('週視圖')).toBeInTheDocument()
    expect(screen.getByText('月視圖')).toBeInTheDocument()
    expect(screen.getByText('習慣')).toBeInTheDocument()
    expect(screen.getByText('例行事項')).toBeInTheDocument()
    expect(screen.getByText('範本')).toBeInTheDocument()
    expect(screen.getByText('統計')).toBeInTheDocument()
  })

  test('Sidebar 顯示使用者名稱與 email', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div />
        </AppLayout>
      </MemoryRouter>
    )

    expect(screen.getByText('測試使用者')).toBeInTheDocument()
    expect(screen.getByText('test@test.com')).toBeInTheDocument()
  })

  test('點擊登出按鈕導向登入頁', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div />
        </AppLayout>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('登出'))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})

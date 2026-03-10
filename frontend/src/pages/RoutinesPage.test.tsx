// 例行事項頁面單元測試
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RoutinesPage from './RoutinesPage'
import * as api from '../api/routines'

// Mock API 模組
vi.mock('../api/routines')

describe('RoutinesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('無資料時顯示空狀態訊息', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([])
    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/尚無例行事項/)).toBeInTheDocument()
    })
  })

  it('顯示例行事項列表', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([{
      id: '1',
      title: '吃午飯',
      color: '#f59e0b',
      start_time: '12:00:00',
      duration: 60,
      days_of_week: [1, 2, 3, 4, 5],
      auto_generate: false,
      is_active: true,
    }])
    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('吃午飯')).toBeInTheDocument()
    })
  })

  it('點擊新增按鈕開啟 Modal', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([])
    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    // 等待頁面載入完成後再點擊 Topbar 新增按鈕（使用 getAllByRole 取第一個，即 Topbar 按鈕）
    await waitFor(() => screen.getAllByRole('button', { name: /新增例行事項/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /新增例行事項/ })[0])
    await waitFor(() => {
      // Modal 標題應出現在畫面上
      expect(screen.getAllByText('新增例行事項').length).toBeGreaterThanOrEqual(2)
    })
  })

  it('點擊取消關閉 Modal', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([])
    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    // 點擊 Topbar 新增按鈕（取第一個）
    await waitFor(() => screen.getAllByRole('button', { name: /新增例行事項/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /新增例行事項/ })[0])
    await waitFor(() => screen.getByText('取消'))
    fireEvent.click(screen.getByText('取消'))
    await waitFor(() => {
      // Modal 關閉後只剩 Topbar 按鈕，標題文字只剩一個
      expect(screen.getAllByText('新增例行事項').length).toBe(1)
    })
  })
})

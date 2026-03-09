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
    // 等待頁面載入完成後再點擊按鈕
    await waitFor(() => screen.getByRole('button', { name: /新增/ }))
    fireEvent.click(screen.getByRole('button', { name: /新增/ }))
    await waitFor(() => {
      expect(screen.getByText('新增例行事項')).toBeInTheDocument()
    })
  })

  it('點擊取消關閉 Modal', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([])
    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    await waitFor(() => screen.getByRole('button', { name: /新增/ }))
    fireEvent.click(screen.getByRole('button', { name: /新增/ }))
    await waitFor(() => screen.getByText('取消'))
    fireEvent.click(screen.getByText('取消'))
    await waitFor(() => {
      expect(screen.queryByText('新增例行事項')).not.toBeInTheDocument()
    })
  })
})

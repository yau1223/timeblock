// 例行事項頁面單元測試
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RoutinesPage from './RoutinesPage'
import * as api from '../api/routines'

// Mock API 模組
vi.mock('../api/routines')

/** 建立測試用例行事項 */
const makeRoutine = (id: string, title: string, overrides = {}) => ({
  id,
  title,
  color: '#f59e0b',
  start_time: '12:00:00',
  duration: 60,
  days_of_week: [1, 2, 3, 4, 5] as number[],
  auto_generate: false,
  is_active: true,
  ...overrides,
})

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
    vi.mocked(api.getRoutines).mockResolvedValue([makeRoutine('1', '吃午飯')])
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

  it('填寫表單後儲存新增例行事項', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([])
    vi.mocked(api.createRoutine).mockResolvedValue(makeRoutine('new-1', '晨跑'))

    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    await waitFor(() => screen.getAllByRole('button', { name: /新增例行事項/ }))

    // 開啟 Modal
    fireEvent.click(screen.getAllByRole('button', { name: /新增例行事項/ })[0])

    // 輸入例行事項名稱
    const input = screen.getByPlaceholderText('例行事項名稱')
    fireEvent.change(input, { target: { value: '晨跑' } })

    // 點擊儲存
    fireEvent.click(screen.getByText('儲存'))

    await waitFor(() => {
      expect(api.createRoutine).toHaveBeenCalledWith(
        expect.objectContaining({ title: '晨跑' })
      )
    })
  })

  it('點擊編輯按鈕開啟編輯 Modal', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([makeRoutine('r-1', '晨間例行')])

    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('晨間例行'))

    // 點擊編輯（✎）按鈕
    fireEvent.click(screen.getByText('✎'))

    await waitFor(() => {
      expect(screen.getByText('編輯例行事項')).toBeInTheDocument()
    })
  })

  it('確認刪除例行事項', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([makeRoutine('r-del', '要刪除的')])
    vi.mocked(api.deleteRoutine).mockResolvedValue(undefined)
    vi.stubGlobal('confirm', () => true)

    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('要刪除的'))

    // 點擊刪除（✕）按鈕
    fireEvent.click(screen.getByText('✕'))

    await waitFor(() => {
      expect(api.deleteRoutine).toHaveBeenCalledWith('r-del')
    })

    vi.unstubAllGlobals()
  })

  it('點擊「套用今日」按鈕呼叫 applyRoutine', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([makeRoutine('r-1', '晨跑')])
    vi.mocked(api.applyRoutine).mockResolvedValue({ created: true })

    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    await waitFor(() => screen.getByText('晨跑'))

    fireEvent.click(screen.getByText('套用今日'))

    await waitFor(() => {
      expect(api.applyRoutine).toHaveBeenCalledWith('r-1', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
    })
  })

  it('切換重複星期', async () => {
    vi.mocked(api.getRoutines).mockResolvedValue([])
    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    await waitFor(() => screen.getAllByRole('button', { name: /新增例行事項/ }))

    // 開啟 Modal
    fireEvent.click(screen.getAllByRole('button', { name: /新增例行事項/ })[0])
    await waitFor(() => screen.getByText('重複星期（不選 = 每天）'))

    // 點擊「日」星期按鈕（切換索引 0）
    const dayButtons = screen.getAllByRole('button').filter(btn => ['日', '一', '二', '三', '四', '五', '六'].includes(btn.textContent ?? ''))
    expect(dayButtons.length).toBe(7)
    fireEvent.click(dayButtons[0]) // 點擊「日」
  })
})

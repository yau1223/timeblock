// HabitsPage 單元測試：驗證習慣列表顯示、打勾切換、新增習慣功能
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import HabitsPage from './HabitsPage'

// mock API 模組
vi.mock('../api/habits', () => ({
  getHabits: vi.fn(),
  createHabit: vi.fn(),
  toggleHabitLog: vi.fn(),
}))

import { getHabits, createHabit, toggleHabitLog } from '../api/habits'

/** 建立測試習慣資料 */
const makeHabit = (id: string, title: string, streak = 0) => ({
  id,
  title,
  color: '#10b981',
  frequency: 'daily',
  duration: 30,
  is_active: true,
  streak,
})

/** 渲染包含路由的 HabitsPage */
const renderPage = () =>
  render(
    <MemoryRouter>
      <HabitsPage />
    </MemoryRouter>
  )

describe('HabitsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getHabits).mockResolvedValue([])
  })

  test('無習慣時顯示空狀態訊息', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('還沒有習慣')).toBeInTheDocument()
      expect(screen.getByText('點擊「+ 新增習慣」開始追蹤你的第一個習慣')).toBeInTheDocument()
    })
  })

  test('顯示習慣列表與連續天數', async () => {
    vi.mocked(getHabits).mockResolvedValue([
      makeHabit('h-1', '晨跑', 5),
      makeHabit('h-2', '冥想', 3),
    ])

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('晨跑')).toBeInTheDocument()
      expect(screen.getByText('冥想')).toBeInTheDocument()
      expect(screen.getByText('連續 5 天')).toBeInTheDocument()
      expect(screen.getByText('連續 3 天')).toBeInTheDocument()
    })
  })

  test('點擊「新增習慣」按鈕開啟 Modal', async () => {
    renderPage()
    await waitFor(() => screen.getByText('還沒有習慣'))

    fireEvent.click(screen.getByText('新增習慣'))
    expect(screen.getByText('新增習慣', { selector: 'h3' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('習慣名稱（例如：晨跑、冥想）')).toBeInTheDocument()
  })

  test('點擊取消關閉 Modal', async () => {
    renderPage()
    await waitFor(() => screen.getByText('還沒有習慣'))

    // 開啟 Modal
    fireEvent.click(screen.getByText('新增習慣'))
    expect(screen.getByPlaceholderText('習慣名稱（例如：晨跑、冥想）')).toBeInTheDocument()

    // 點擊取消
    fireEvent.click(screen.getByText('取消'))
    expect(screen.queryByPlaceholderText('習慣名稱（例如：晨跑、冥想）')).not.toBeInTheDocument()
  })

  test('輸入名稱後新增習慣', async () => {
    vi.mocked(createHabit).mockResolvedValue(makeHabit('h-new', '游泳', 0))
    vi.mocked(getHabits)
      .mockResolvedValueOnce([])
      .mockResolvedValue([makeHabit('h-new', '游泳', 0)])

    renderPage()
    await waitFor(() => screen.getByText('還沒有習慣'))

    // 開啟 Modal
    fireEvent.click(screen.getByText('新增習慣'))

    // 輸入習慣名稱
    const input = screen.getByPlaceholderText('習慣名稱（例如：晨跑、冥想）')
    fireEvent.change(input, { target: { value: '游泳' } })

    // 點擊新增
    fireEvent.click(screen.getAllByText('新增')[screen.getAllByText('新增').length - 1])

    await waitFor(() => {
      expect(createHabit).toHaveBeenCalledWith({ title: '游泳', color: '#10b981' })
    })
  })

  test('點擊打勾按鈕切換習慣完成狀態', async () => {
    vi.mocked(getHabits).mockResolvedValue([makeHabit('h-1', '晨跑', 5)])
    vi.mocked(toggleHabitLog).mockResolvedValue({ date: '2026-03-10', completed: true })

    renderPage()
    await waitFor(() => screen.getByText('晨跑'))

    // 點擊打勾按鈕
    const toggleBtn = screen.getByLabelText('標記為完成')
    fireEvent.click(toggleBtn)

    await waitFor(() => {
      expect(toggleHabitLog).toHaveBeenCalledWith('h-1', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
    })
  })

  test('Topbar 顯示「習慣管理」標題', async () => {
    renderPage()
    await waitFor(() => screen.getByText('還沒有習慣'))

    expect(screen.getByText('習慣管理')).toBeInTheDocument()
  })
})

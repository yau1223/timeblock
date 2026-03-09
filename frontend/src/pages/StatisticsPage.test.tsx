// 統計頁面單元測試
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import StatisticsPage from './StatisticsPage'
import * as api from '../api/statistics'
import React from 'react'

// Mock API 模組（含 getHabitHeatmap，避免未 mock 時拋出錯誤）
vi.mock('../api/statistics')

// Mock Recharts（避免 SVG 渲染問題）
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('StatisticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 預設 getHabitHeatmap 回傳空物件，避免個別測試未設定時出錯
    vi.mocked(api.getHabitHeatmap).mockResolvedValue({})
  })

  it('無資料時顯示空狀態訊息', async () => {
    vi.mocked(api.getTimeDistribution).mockResolvedValue([])
    vi.mocked(api.getHabitsCompletion).mockResolvedValue([])
    render(<MemoryRouter><StatisticsPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/無時間塊資料/)).toBeInTheDocument()
    })
  })

  it('顯示習慣完成率', async () => {
    vi.mocked(api.getTimeDistribution).mockResolvedValue([])
    vi.mocked(api.getHabitsCompletion).mockResolvedValue([{
      habit_id: '1',
      title: '晨跑',
      color: '#10b981',
      completed: 5,
      total: 7,
      rate: 71.4,
    }])
    render(<MemoryRouter><StatisticsPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('晨跑')).toBeInTheDocument()
      // StatisticsPage 顯示格式為 "{completed}/{total} 天（{rate}%）"
      expect(screen.getByText(/71\.4%/)).toBeInTheDocument()
    })
  })

  it('顯示時間分配圖表', async () => {
    vi.mocked(api.getTimeDistribution).mockResolvedValue([
      { category: '工作', minutes: 240 },
    ])
    vi.mocked(api.getHabitsCompletion).mockResolvedValue([])
    render(<MemoryRouter><StatisticsPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })

  it('顯示時間分配與習慣完成率標題', async () => {
    vi.mocked(api.getTimeDistribution).mockResolvedValue([])
    vi.mocked(api.getHabitsCompletion).mockResolvedValue([])
    render(<MemoryRouter><StatisticsPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('時間分配')).toBeInTheDocument()
      expect(screen.getByText('習慣完成率')).toBeInTheDocument()
    })
  })
})

// TemplatesPage 單元測試：驗證範本列表顯示、新增與刪除功能
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TemplatesPage from './TemplatesPage'

// mock API 模組
vi.mock('../api/templates', () => ({
  getTemplates: vi.fn(),
  createTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}))

vi.mock('../api/blocks', () => ({
  getBlocksByDate: vi.fn(),
  createBlock: vi.fn(),
}))

import { getTemplates, createTemplate, deleteTemplate } from '../api/templates'
import { getBlocksByDate } from '../api/blocks'

/** 輔助函式：渲染包含路由的 TemplatesPage */
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/templates']}>
      <TemplatesPage />
    </MemoryRouter>
  )

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 預設空範本列表
    vi.mocked(getTemplates).mockResolvedValue([])
  })

  test('顯示空狀態文字', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('還沒有範本')).toBeInTheDocument()
    })
  })

  test('顯示範本名稱與時間塊數量', async () => {
    vi.mocked(getTemplates).mockResolvedValue([
      {
        id: 'tmpl-1',
        name: '工作日',
        blocks: [
          { title: '晨跑', color: '#22c55e', offset_minutes: 360, duration_minutes: 30 },
          { title: '深度工作', color: '#6366f1', offset_minutes: 540, duration_minutes: 120 },
        ],
        created_at: '2026-03-08T00:00:00Z',
      },
    ])

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('工作日')).toBeInTheDocument()
      expect(screen.getByText('2 個時間塊')).toBeInTheDocument()
      expect(screen.getByText('晨跑')).toBeInTheDocument()
      expect(screen.getByText('深度工作')).toBeInTheDocument()
    })
  })

  test('點擊「+ 從今日另存」開啟 Modal', async () => {
    renderPage()

    await waitFor(() => screen.getByText('還沒有範本'))

    fireEvent.click(screen.getByText('+ 從今日另存'))
    expect(screen.getByText('另存為範本')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('範本名稱（例如：工作日、週末）')).toBeInTheDocument()
  })

  test('輸入名稱後儲存範本', async () => {
    vi.mocked(getBlocksByDate).mockResolvedValue([])
    vi.mocked(createTemplate).mockResolvedValue({
      id: 'new-1',
      name: '週末',
      blocks: [],
      created_at: '2026-03-08T00:00:00Z',
    })
    // 第二次呼叫 getTemplates 回傳新範本
    vi.mocked(getTemplates)
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        { id: 'new-1', name: '週末', blocks: [], created_at: '2026-03-08T00:00:00Z' },
      ])

    renderPage()
    await waitFor(() => screen.getByText('還沒有範本'))

    // 開啟 Modal
    fireEvent.click(screen.getByText('+ 從今日另存'))
    const input = screen.getByPlaceholderText('範本名稱（例如：工作日、週末）')
    fireEvent.change(input, { target: { value: '週末' } })

    // 點擊儲存
    fireEvent.click(screen.getByText('儲存'))

    await waitFor(() => {
      expect(createTemplate).toHaveBeenCalledWith({ name: '週末', blocks: [] })
    })
  })

  test('點擊 × 刪除範本', async () => {
    vi.mocked(getTemplates).mockResolvedValue([
      { id: 'tmpl-del', name: '要刪除', blocks: [], created_at: '2026-03-08T00:00:00Z' },
    ])
    vi.mocked(deleteTemplate).mockResolvedValue(undefined)
    // confirm 視窗預設回傳 true
    vi.stubGlobal('confirm', () => true)

    renderPage()
    await waitFor(() => screen.getByText('要刪除'))

    fireEvent.click(screen.getByText('×'))

    await waitFor(() => {
      expect(deleteTemplate).toHaveBeenCalledWith('tmpl-del')
    })

    vi.unstubAllGlobals()
  })

  test('點擊「套用到某天」展開日期選擇器', async () => {
    vi.mocked(getTemplates).mockResolvedValue([
      { id: 'tmpl-apply', name: '工作日', blocks: [], created_at: '2026-03-08T00:00:00Z' },
    ])

    renderPage()
    await waitFor(() => screen.getByText('工作日'))

    fireEvent.click(screen.getByText('套用到某天'))
    expect(screen.getByRole('button', { name: '套用' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
  })

  test('導覽列包含所有連結', async () => {
    renderPage()
    await waitFor(() => screen.getByText('還沒有範本'))

    expect(screen.getByRole('link', { name: '日' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '週' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '月' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '習慣' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '範本' })).toBeInTheDocument()
  })
})

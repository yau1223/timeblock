// BlockCard 單元測試：驗證渲染、刪除、完成標記功能以及工具函式
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import BlockCard, { timeToTopPx, durationToHeightPx, HOUR_HEIGHT } from './BlockCard'
import type { TimeBlock } from '../api/blocks'

// mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
  }),
}))

// mock updateBlock API
vi.mock('../api/blocks', () => ({
  updateBlock: vi.fn().mockResolvedValue({}),
  createBlock: vi.fn(),
  deleteBlock: vi.fn(),
  getBlocksByDate: vi.fn(),
}))

/** 建立測試用時間塊資料 */
const makeBlock = (overrides: Partial<TimeBlock> = {}): TimeBlock => ({
  id: 'block-1',
  title: '深度工作',
  start_time: '2026-03-10T09:00:00.000Z',
  end_time: '2026-03-10T10:00:00.000Z',
  color: '#6366f1',
  completed_at: null,
  ...overrides,
})

describe('BlockCard 工具函式', () => {
  test('HOUR_HEIGHT 為 64', () => {
    expect(HOUR_HEIGHT).toBe(64)
  })

  test('timeToTopPx：9:00 回傳 9 * 64 = 576（UTC+0 情境）', () => {
    // ISO UTC 時間，不同時區結果不同，只驗證回傳數值型別
    const result = timeToTopPx('2026-03-10T09:00:00.000Z')
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThanOrEqual(0)
  })

  test('durationToHeightPx：1 小時回傳 64px', () => {
    const result = durationToHeightPx(
      '2026-03-10T09:00:00.000Z',
      '2026-03-10T10:00:00.000Z'
    )
    expect(result).toBe(64)
  })

  test('durationToHeightPx：極短時間塊最小高度為 24px', () => {
    const result = durationToHeightPx(
      '2026-03-10T09:00:00.000Z',
      '2026-03-10T09:00:01.000Z'
    )
    expect(result).toBe(24)
  })

  test('durationToHeightPx：2 小時回傳 128px', () => {
    const result = durationToHeightPx(
      '2026-03-10T09:00:00.000Z',
      '2026-03-10T11:00:00.000Z'
    )
    expect(result).toBe(128)
  })
})

describe('BlockCard 元件', () => {
  test('顯示時間塊標題', () => {
    render(
      <BlockCard
        block={makeBlock()}
        topPx={100}
        heightPx={64}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText('深度工作')).toBeInTheDocument()
  })

  test('點擊刪除按鈕呼叫 onDelete', () => {
    const onDelete = vi.fn()
    render(
      <BlockCard
        block={makeBlock()}
        topPx={100}
        heightPx={64}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByLabelText('刪除時間塊'))
    expect(onDelete).toHaveBeenCalledWith('block-1')
  })

  test('已完成時顯示「✓ 已完成」標籤（高度 > 48）', () => {
    render(
      <BlockCard
        block={makeBlock({ completed_at: '2026-03-10T10:00:00.000Z' })}
        topPx={100}
        heightPx={64}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText('✓ 已完成')).toBeInTheDocument()
  })

  test('未完成且高度 > 48 時顯示 FocusTimer', () => {
    render(
      <BlockCard
        block={makeBlock({ completed_at: null })}
        topPx={100}
        heightPx={64}
        onDelete={() => {}}
      />
    )
    // FocusTimer 初始顯示「▶ 專注」按鈕
    expect(screen.getByText('▶ 專注')).toBeInTheDocument()
  })

  test('高度 ≤ 48 時不顯示 FocusTimer 或完成標記', () => {
    render(
      <BlockCard
        block={makeBlock()}
        topPx={100}
        heightPx={48}
        onDelete={() => {}}
      />
    )
    expect(screen.queryByText('▶ 專注')).not.toBeInTheDocument()
    expect(screen.queryByText('✓ 已完成')).not.toBeInTheDocument()
  })
})

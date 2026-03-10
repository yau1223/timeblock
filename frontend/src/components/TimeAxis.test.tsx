import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import TimeAxis from './TimeAxis'

// mock dnd-kit（TimeAxis 使用 useDroppable，DndContext 已提升至 DayView）
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: () => [],
  useDraggable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null }),
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
}))

// mock API
vi.mock('../api/blocks', () => ({
  createBlock: vi.fn().mockResolvedValue({ id: 'new-block' }),
  updateBlock: vi.fn(),
  deleteBlock: vi.fn().mockResolvedValue(undefined),
}))

import { createBlock } from '../api/blocks'

/** 建立測試用時間塊 */
const makeBlock = (id: string) => ({
  id,
  title: '測試時間塊',
  start_time: '2026-03-10T09:00:00.000Z',
  end_time: '2026-03-10T10:00:00.000Z',
  color: '#6366f1',
  completed_at: null,
  is_recurring: false,
})

describe('TimeAxis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom 不支援 setPointerCapture，需要 mock 避免測試拋出例外
    HTMLDivElement.prototype.setPointerCapture = vi.fn()
    HTMLDivElement.prototype.releasePointerCapture = vi.fn()
  })

  test('renders 24 hour labels', () => {
    render(<TimeAxis date="2026-03-08" blocks={[]} onRefresh={() => {}} />)
    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(screen.getByText('23:00')).toBeInTheDocument()
  })

  test('顯示時間塊標題', () => {
    render(
      <TimeAxis
        date="2026-03-10"
        blocks={[makeBlock('b-1')]}
        onRefresh={() => {}}
      />
    )
    expect(screen.getByText('測試時間塊')).toBeInTheDocument()
  })

  test('點擊時間軸後顯示新增 Modal', () => {
    render(<TimeAxis date="2026-03-10" blocks={[]} onRefresh={() => {}} />)

    // 取得時間軸容器並模擬 pointer 事件開啟 Modal
    const container = document.querySelector('[style*="height"]') as HTMLElement
    expect(container).toBeTruthy()

    // 模擬點擊第 9 格（9:00）
    fireEvent.pointerDown(container, {
      clientY: 9 * 64 + 32,
      pointerId: 1,
    })
    fireEvent.pointerUp(container)

    expect(screen.getByText('新增時間塊')).toBeInTheDocument()
  })

  test('Modal 中點擊新增呼叫 createBlock', async () => {
    render(<TimeAxis date="2026-03-10" blocks={[]} onRefresh={() => {}} />)

    const container = document.querySelector('[style*="height"]') as HTMLElement
    fireEvent.pointerDown(container, { clientY: 9 * 64 + 32, pointerId: 1 })
    fireEvent.pointerUp(container)

    expect(screen.getByText('新增時間塊')).toBeInTheDocument()

    // 點擊新增按鈕
    fireEvent.click(screen.getByRole('button', { name: '新增' }))

    await waitFor(() => {
      expect(createBlock).toHaveBeenCalled()
    })
  })

  test('Modal 中點擊取消關閉 Modal', () => {
    render(<TimeAxis date="2026-03-10" blocks={[]} onRefresh={() => {}} />)

    const container = document.querySelector('[style*="height"]') as HTMLElement
    fireEvent.pointerDown(container, { clientY: 9 * 64 + 32, pointerId: 1 })
    fireEvent.pointerUp(container)

    expect(screen.getByText('新增時間塊')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '取消' }))

    expect(screen.queryByText('新增時間塊')).not.toBeInTheDocument()
  })
})

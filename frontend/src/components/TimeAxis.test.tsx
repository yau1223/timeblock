import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
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
  createBlock: vi.fn(),
  updateBlock: vi.fn(),
  deleteBlock: vi.fn(),
}))

describe('TimeAxis', () => {
  test('renders 24 hour labels', () => {
    render(<TimeAxis date="2026-03-08" blocks={[]} onRefresh={() => {}} />)
    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(screen.getByText('23:00')).toBeInTheDocument()
  })
})

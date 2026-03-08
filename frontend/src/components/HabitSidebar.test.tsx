import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import HabitSidebar from './HabitSidebar'

// mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    isDragging: false,
  }),
}))

describe('HabitSidebar', () => {
  // mock 資料符合 Habit 型別（含 frequency, duration, is_active）
  const mockHabits = [
    { id: '1', title: '晨跑', color: '#22c55e', streak: 3, frequency: 'daily', duration: 30, is_active: true },
    { id: '2', title: '冥想', color: '#6366f1', streak: 7, frequency: 'daily', duration: 15, is_active: true },
  ]

  test('renders habits list', () => {
    render(<HabitSidebar habits={mockHabits} onAddHabit={() => {}} />)
    expect(screen.getByText('晨跑')).toBeInTheDocument()
    expect(screen.getByText('冥想')).toBeInTheDocument()
  })

  test('shows streak counts', () => {
    render(<HabitSidebar habits={mockHabits} onAddHabit={() => {}} />)
    expect(screen.getByText('🔥3')).toBeInTheDocument()
    expect(screen.getByText('🔥7')).toBeInTheDocument()
  })

  test('shows empty state when no habits', () => {
    render(<HabitSidebar habits={[]} onAddHabit={() => {}} />)
    expect(screen.getByText('尚無習慣')).toBeInTheDocument()
  })

  test('calls onAddHabit when button clicked', () => {
    const onAddHabit = vi.fn()
    render(<HabitSidebar habits={[]} onAddHabit={onAddHabit} />)
    fireEvent.click(screen.getByText('+ 新增習慣'))
    expect(onAddHabit).toHaveBeenCalledTimes(1)
  })
})

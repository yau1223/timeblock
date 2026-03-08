import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import DailyProgress from './DailyProgress'
import type { TimeBlock } from '../api/blocks'

describe('DailyProgress', () => {
  const mockBlocks: TimeBlock[] = [
    {
      id: '1', title: 'A', color: '#6366f1',
      start_time: '2026-03-08T01:00:00Z', end_time: '2026-03-08T03:00:00Z',
      is_recurring: false, completed_at: '2026-03-08T03:00:00Z'
    },
    {
      id: '2', title: 'B', color: '#6366f1',
      start_time: '2026-03-08T04:00:00Z', end_time: '2026-03-08T06:00:00Z',
      is_recurring: false, completed_at: null
    },
  ]

  test('shows scheduled hours (4h total)', () => {
    render(<DailyProgress blocks={mockBlocks} />)
    expect(screen.getByText(/已排 4\.0h/)).toBeInTheDocument()
  })

  test('shows completed hours (2h)', () => {
    render(<DailyProgress blocks={mockBlocks} />)
    expect(screen.getByText(/完成 2\.0h/)).toBeInTheDocument()
  })

  test('shows free hours (20h)', () => {
    render(<DailyProgress blocks={mockBlocks} />)
    expect(screen.getByText(/空閒 20\.0h/)).toBeInTheDocument()
  })

  test('shows zero hours for empty blocks', () => {
    render(<DailyProgress blocks={[]} />)
    expect(screen.getByText(/已排 0\.0h/)).toBeInTheDocument()
    expect(screen.getByText(/空閒 24\.0h/)).toBeInTheDocument()
  })
})

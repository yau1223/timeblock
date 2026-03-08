import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import FocusTimer from './FocusTimer'

describe('FocusTimer', () => {
  test('shows start button initially', () => {
    const endTime = new Date(Date.now() + 3600000).toISOString()
    render(<FocusTimer endTime={endTime} onComplete={() => {}} />)
    expect(screen.getByText('▶ 專注')).toBeInTheDocument()
  })

  test('shows countdown and complete button after start', () => {
    const endTime = new Date(Date.now() + 3600000).toISOString()
    render(<FocusTimer endTime={endTime} onComplete={() => {}} />)
    fireEvent.click(screen.getByText('▶ 專注'))
    expect(screen.getByText('✓ 完成')).toBeInTheDocument()
    // 確認計時器格式 mm:ss
    expect(screen.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument()
  })

  test('calls onComplete when complete button clicked', () => {
    const onComplete = vi.fn()
    const endTime = new Date(Date.now() + 3600000).toISOString()
    render(<FocusTimer endTime={endTime} onComplete={onComplete} />)
    fireEvent.click(screen.getByText('▶ 專注'))
    fireEvent.click(screen.getByText('✓ 完成'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import ColorPicker from './ColorPicker'

describe('ColorPicker', () => {
  test('renders 10 color buttons', () => {
    render(<ColorPicker value="#ef4444" onChange={() => {}} />)
    expect(screen.getAllByRole('radio')).toHaveLength(10)
  })

  test('marks selected color as checked', () => {
    render(<ColorPicker value="#6366f1" onChange={() => {}} />)
    expect(screen.getByLabelText('#6366f1')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('#ef4444')).toHaveAttribute('aria-checked', 'false')
  })

  test('calls onChange with selected color', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#ef4444" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('#6366f1'))
    expect(onChange).toHaveBeenCalledWith('#6366f1')
  })
})

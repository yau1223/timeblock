// src/components/layout/Topbar.tsx
// 頁面頂部操作欄，接受左側內容與右側按鈕 props
import type { ReactNode } from 'react'

interface TopbarProps {
  left?: ReactNode   // 標題、日期切換等
  right?: ReactNode  // CTA 按鈕
}

/** 頁面頂部欄：白底、高度 64px、支援自訂左右側內容 */
export default function Topbar({ left, right }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {left}
      </div>
      <div className="flex items-center gap-2">
        {right}
      </div>
    </header>
  )
}

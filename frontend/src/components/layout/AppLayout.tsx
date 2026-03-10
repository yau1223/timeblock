// src/components/layout/AppLayout.tsx
// 應用程式主佈局：固定 Sidebar + 主內容區
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: ReactNode
}

/** 主佈局框架：左側固定 Sidebar + 右側主內容 */
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      {/* ml-[220px] 避免被 Sidebar 覆蓋 */}
      <main className="flex-1 ml-[220px] flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

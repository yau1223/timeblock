# TimeBlock UI 全面重設計 實作計劃

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將 TimeBlock 從基本功能性 UI 升級為 Google Calendar 風格的現代亮色生產力工具，採用左側深 indigo Sidebar + 白色主內容區佈局。

**Architecture:** 新增 `AppLayout` 元件包含固定 Sidebar（220px）與主內容區；所有頁面移除獨立導覽列，統一透過 Sidebar 導覽；各頁面頂部新增 `Topbar` 元件承載標題與操作按鈕。

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, React Router v6, lucide-react（icons）

---

## 前置準備

確認工作目錄：`timeblock/frontend/`

安裝 lucide-react（圖示庫）：
```bash
cd timeblock/frontend && npm install lucide-react
```

---

### Task 1: 建立 AppLayout 元件

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/AppLayout.tsx`

**Step 1: 建立 Sidebar 元件**

```tsx
// src/components/layout/Sidebar.tsx
// 全域左側導覽欄，深 indigo 背景，包含 Logo、頁面導覽、使用者資訊
import { NavLink, useNavigate } from 'react-router-dom'
import {
  CalendarDays, CalendarRange, Calendar, CheckSquare,
  RefreshCw, LayoutTemplate, BarChart2, LogOut, Clock
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

/** 單一導覽項目 */
function NavItem({
  to, icon: Icon, label
}: {
  to: string
  icon: React.ElementType
  label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

/** 左側固定導覽列 */
export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  /** 登出並跳轉登入頁 */
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-[220px] h-screen bg-[#1E1B4B] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo 區 */}
      <div className="px-6 py-5 border-b border-indigo-800">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-indigo-400" />
          <span className="text-white font-bold text-lg">TimeBlock</span>
        </div>
      </div>

      {/* 導覽列表 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/day" icon={CalendarDays} label="日視圖" />
        <NavItem to="/week" icon={CalendarRange} label="週視圖" />
        <NavItem to="/month" icon={Calendar} label="月視圖" />
        <div className="pt-3 pb-1">
          <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            管理
          </p>
        </div>
        <NavItem to="/habits" icon={CheckSquare} label="習慣" />
        <NavItem to="/routines" icon={RefreshCw} label="例行事項" />
        <NavItem to="/templates" icon={LayoutTemplate} label="範本" />
        <NavItem to="/statistics" icon={BarChart2} label="統計" />
      </nav>

      {/* 底部使用者區 */}
      <div className="px-4 py-4 border-t border-indigo-800">
        {user && (
          <div className="mb-3 px-1">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-indigo-300 text-xs truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors w-full px-1"
        >
          <LogOut size={16} />
          登出
        </button>
      </div>
    </aside>
  )
}
```

**Step 2: 建立 AppLayout 元件**

```tsx
// src/components/layout/AppLayout.tsx
// 應用程式主佈局：固定 Sidebar + 主內容區
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
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
```

**Step 3: 確認元件結構正確，執行 TypeScript 檢查**

```bash
cd timeblock/frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: 無 layout 相關錯誤（可能有其他既有錯誤暫時忽略）

**Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: 新增 AppLayout 與 Sidebar 元件（深 indigo 主題）"
```

---

### Task 2: 建立 Topbar 元件

**Files:**
- Create: `src/components/layout/Topbar.tsx`

**Step 1: 建立 Topbar 元件**

```tsx
// src/components/layout/Topbar.tsx
// 頁面頂部操作欄，接受左側內容與右側按鈕 props
interface TopbarProps {
  left?: React.ReactNode   // 標題、日期切換等
  right?: React.ReactNode  // CTA 按鈕
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
```

**Step 2: Commit**

```bash
git add src/components/layout/Topbar.tsx
git commit -m "feat: 新增 Topbar 元件"
```

---

### Task 3: 更新 App.tsx 套用 AppLayout

**Files:**
- Modify: `src/App.tsx`

**Step 1: 更新 App.tsx**

```tsx
// src/App.tsx
// 應用程式主路由設定
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DayView from './pages/DayView'
import WeekView from './pages/WeekView'
import MonthView from './pages/MonthView'
import HabitsPage from './pages/HabitsPage'
import TemplatesPage from './pages/TemplatesPage'
import RoutinesPage from './pages/RoutinesPage'
import StatisticsPage from './pages/StatisticsPage'

// 需要登入才能存取的路由守衛，套用 AppLayout
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/day" element={<ProtectedRoute><DayView /></ProtectedRoute>} />
        <Route path="/week" element={<ProtectedRoute><WeekView /></ProtectedRoute>} />
        <Route path="/month" element={<ProtectedRoute><MonthView /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
        <Route path="/routines" element={<ProtectedRoute><RoutinesPage /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/day" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**Step 2: 執行 TypeScript 檢查**

```bash
cd timeblock/frontend && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx 套用 AppLayout 至所有受保護路由"
```

---

### Task 4: 重構 DayView — 移除舊導覽列，接入 Topbar

**Files:**
- Modify: `src/pages/DayView.tsx`

**Step 1: 更新 DayView.tsx**

將舊的 `<nav>` 導覽列移除，改用 Topbar 元件，並讓 TimeAxis 全寬顯示（移除 HabitSidebar 並排佈局，習慣側欄改為浮動按鈕觸發）：

```tsx
// src/pages/DayView.tsx
// 日視圖頁面：24 小時時間軸，支援日期切換，使用新版 AppLayout Topbar
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import TimeAxis from '../components/TimeAxis'
import HabitSidebar from '../components/HabitSidebar'
import DailyProgress from '../components/DailyProgress'
import { getBlocksByDate, createBlock, updateBlock } from '../api/blocks'
import type { TimeBlock } from '../api/blocks'
import { getHabits, createHabit } from '../api/habits'
import type { Habit } from '../api/habits'
import { autoGenerateRoutines } from '../api/routines'

/** 日視圖：顯示單日 24 小時時間塊，使用全寬佈局 */
export default function DayView() {
  const [searchParams] = useSearchParams()
  const initialDate = searchParams.get('date')
    ? new Date(searchParams.get('date')!)
    : new Date()

  const [currentDate, setCurrentDate] = useState(initialDate)
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitTitle, setNewHabitTitle] = useState('')

  const dateStr = format(currentDate, 'yyyy-MM-dd')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBlocksByDate(dateStr)
      setBlocks(data)
    } catch {
      setError('載入失敗，請重試')
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  const refreshHabits = useCallback(async () => {
    try {
      const data = await getHabits()
      setHabits(data)
    } catch (err) {
      console.error('載入習慣失敗', err)
    }
  }, [])

  const triggerAutoGenerate = useCallback(async () => {
    try {
      await autoGenerateRoutines(dateStr)
    } catch {
      // 自動生成失敗不阻礙頁面載入
    }
  }, [dateStr])

  useEffect(() => {
    triggerAutoGenerate().then(() => refresh())
    refreshHabits()
  }, [triggerAutoGenerate, refresh, refreshHabits])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event

    if (active.data.current?.type === 'habit' && over?.data.current?.hour !== undefined) {
      const habit = active.data.current.habit as Habit
      const dropHour = over.data.current.hour as number
      const startDate = new Date(`${dateStr}T${String(dropHour).padStart(2, '0')}:00:00`)
      const endDate = new Date(startDate.getTime() + 3600000)
      try {
        await createBlock({
          title: habit.title,
          color: habit.color,
          habit_id: habit.id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        })
        refresh()
      } catch (err) {
        console.error('從習慣建立時間塊失敗', err)
      }
      return
    }

    const block = blocks.find((b) => b.id === active.id)
    if (!block || Math.abs(delta.y) < 5) return

    const HOUR_HEIGHT = 64
    const deltaMs = (delta.y / HOUR_HEIGHT) * 3600000
    const newStart = new Date(new Date(block.start_time).getTime() + deltaMs)
    const newEnd = new Date(new Date(block.end_time).getTime() + deltaMs)

    try {
      await updateBlock(String(active.id), {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      })
      refresh()
    } catch (err) {
      console.error('更新時間塊失敗', err)
    }
  }

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) return
    try {
      await createHabit({ title: newHabitTitle.trim(), color: '#10b981' })
      setNewHabitTitle('')
      setShowAddHabit(false)
      refreshHabits()
    } catch (err) {
      console.error('新增習慣失敗', err)
    }
  }

  /** Topbar 左側：日期切換 */
  const topbarLeft = (
    <>
      <button
        onClick={() => setCurrentDate((d) => subDays(d, 1))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        aria-label="前一天"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="text-center">
        <h1 className="font-semibold text-gray-900">
          {format(currentDate, 'M月d日', { locale: zhTW })}
        </h1>
        <p className="text-xs text-gray-400">
          {format(currentDate, 'yyyy年 EEEE', { locale: zhTW })}
        </p>
      </div>
      <button
        onClick={() => setCurrentDate((d) => addDays(d, 1))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        aria-label="後一天"
      >
        <ChevronRight size={18} />
      </button>
      <button
        onClick={() => setCurrentDate(new Date())}
        className="text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1 hover:bg-indigo-50 transition-colors ml-2"
      >
        今天
      </button>
    </>
  )

  /** Topbar 右側：新增習慣按鈕 */
  const topbarRight = (
    <button
      onClick={() => setShowAddHabit(true)}
      className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
    >
      <Plus size={16} />
      新增習慣
    </button>
  )

  return (
    <div className="flex flex-col h-full">
      <Topbar left={topbarLeft} right={topbarRight} />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* 習慣側邊欄：保留拖曳功能 */}
          <HabitSidebar habits={habits} onAddHabit={() => setShowAddHabit(true)} />

          <div className="flex-1 flex flex-col overflow-hidden">
            <DailyProgress blocks={blocks} />
            {loading && (
              <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
                載入中...
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center flex-1 text-red-500 text-sm">
                {error}
              </div>
            )}
            {!loading && !error && (
              <div className="flex-1 overflow-y-auto m-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <TimeAxis date={dateStr} blocks={blocks} onRefresh={refresh} />
              </div>
            )}
          </div>
        </div>
      </DndContext>

      {/* 新增習慣 Modal */}
      {showAddHabit && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => { setShowAddHabit(false); setNewHabitTitle('') }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-96 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-4 text-gray-900">新增習慣</h3>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="習慣名稱（例如：晨跑、冥想）"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddHabit}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                新增
              </button>
              <button
                onClick={() => { setShowAddHabit(false); setNewHabitTitle('') }}
                className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: 執行測試確認無破壞**

```bash
cd timeblock/frontend && npm test -- --run 2>&1 | tail -20
```

Expected: 所有測試通過（DayView 測試可能需要 mock Topbar，視情況修正）

**Step 3: Commit**

```bash
git add src/pages/DayView.tsx
git commit -m "feat: DayView 移除舊導覽列，接入 Topbar 元件"
```

---

### Task 5: 重構 WeekView 與 MonthView

**Files:**
- Modify: `src/pages/WeekView.tsx`
- Modify: `src/pages/MonthView.tsx`

**Step 1: 讀取並更新 WeekView.tsx**

移除 `<nav>` 標籤，在頁面最上方加入 Topbar（含週範圍標題與前後切換按鈕）：

```tsx
// 在 return 最外層 div 內，nav 改為：
<Topbar
  left={
    <>
      <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></button>
      <h1 className="font-semibold text-gray-900">{weekRangeLabel}</h1>
      <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={18} /></button>
      <button onClick={goToday} className="text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1 hover:bg-indigo-50 ml-2">本週</button>
    </>
  }
/>
```

**Step 2: 更新 MonthView.tsx**

同上模式，標題改為月份，按鈕改為月份切換。

**Step 3: 執行測試**

```bash
cd timeblock/frontend && npm test -- --run 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/pages/WeekView.tsx src/pages/MonthView.tsx
git commit -m "feat: WeekView 與 MonthView 移除舊導覽列，接入 Topbar"
```

---

### Task 6: 重構管理頁面（Habits、Routines、Templates、Statistics）

**Files:**
- Modify: `src/pages/HabitsPage.tsx`
- Modify: `src/pages/RoutinesPage.tsx`
- Modify: `src/pages/TemplatesPage.tsx`
- Modify: `src/pages/StatisticsPage.tsx`

**Step 1: 各頁面統一模式**

每個管理頁面：
1. 移除頂部 `<nav>` 標籤
2. 加入 `<Topbar left={<h1>頁面標題</h1>} right={<新增按鈕>} />`
3. 主內容區加上 `px-6 py-4` padding

HabitsPage Topbar：
```tsx
<Topbar
  left={<h1 className="font-semibold text-xl text-gray-900">習慣管理</h1>}
  right={
    <button onClick={...} className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700">
      <Plus size={16} /> 新增習慣
    </button>
  }
/>
```

RoutinesPage Topbar：`例行事項` + `新增例行事項` 按鈕

TemplatesPage Topbar：`範本庫` + `新增範本` 按鈕

StatisticsPage Topbar：`統計分析` + 日期範圍選擇器（現有功能移至右側）

**Step 2: 執行所有測試**

```bash
cd timeblock/frontend && npm test -- --run 2>&1 | tail -20
```

Expected: 所有測試通過，覆蓋率 ≥ 80%

**Step 3: Commit**

```bash
git add src/pages/HabitsPage.tsx src/pages/RoutinesPage.tsx src/pages/TemplatesPage.tsx src/pages/StatisticsPage.tsx
git commit -m "feat: 管理頁面移除舊導覽列，接入 Topbar"
```

---

### Task 7: 升級 LoginPage 視覺

**Files:**
- Modify: `src/pages/LoginPage.tsx`

**Step 1: 更新 LoginPage 視覺**

居中卡片，indigo 主題，移除所有舊有 gray-100 背景：

```tsx
// LoginPage return 最外層 div：
<div className="min-h-screen bg-gradient-to-br from-indigo-950 to-indigo-800 flex items-center justify-center p-4">
  <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
    {/* Logo */}
    <div className="flex items-center gap-2 mb-8 justify-center">
      <Clock size={28} className="text-indigo-600" />
      <span className="text-2xl font-bold text-gray-900">TimeBlock</span>
    </div>

    <h2 className="text-xl font-semibold text-gray-900 mb-1">
      {isLogin ? '歡迎回來' : '建立帳號'}
    </h2>
    <p className="text-sm text-gray-500 mb-6">
      {isLogin ? '請登入您的帳號' : '開始管理您的時間'}
    </p>

    {/* 原有表單內容，調整 class */}
    {/* input: border-gray-200 focus:ring-indigo-500 */}
    {/* submit button: bg-indigo-600 hover:bg-indigo-700 */}
    {/* 切換連結: text-indigo-600 */}
  </div>
</div>
```

**Step 2: Commit**

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat: LoginPage 升級為深 indigo 漸層背景 + 白色卡片"
```

---

### Task 8: 升級 BlockCard 樣式

**Files:**
- Modify: `src/components/BlockCard.tsx`

**Step 1: 讀取現有 BlockCard.tsx 結構**

確認卡片 DOM 結構後，加入左側色條與 hover 效果：

```tsx
// 在卡片最外層 div 加入：
// - 左側色條：borderLeft: `3px solid ${block.color}`
// - hover 效果：hover:shadow-md hover:scale-[1.01] transition-all
// - 背景：淡色 opacity-10 填充，文字用 block.color 深色版

// 範例卡片結構：
<div
  data-block
  style={{
    borderLeft: `3px solid ${block.color}`,
    backgroundColor: `${block.color}18`,  // 10% opacity
    color: block.color,
  }}
  className="... rounded-lg shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-150"
>
```

**Step 2: 執行測試**

```bash
cd timeblock/frontend && npm test -- --run 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add src/components/BlockCard.tsx
git commit -m "feat: BlockCard 加入左側色條與 hover 動效"
```

---

### Task 9: 升級 HabitSidebar 樣式

**Files:**
- Modify: `src/components/HabitSidebar.tsx`

**Step 1: 更新習慣側邊欄樣式**

```tsx
// HabitSidebar 外層 div：
<div className="w-44 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col h-full shadow-sm">
  {/* 標題 */}
  <div className="px-4 py-3 border-b border-gray-100">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">習慣</h3>
  </div>
  {/* 習慣列表 */}
  <div className="flex-1 overflow-y-auto p-2 space-y-1">
    {/* DraggableHabitItem 樣式升級 */}
  </div>
  {/* 新增按鈕 */}
  <div className="p-3 border-t border-gray-100">
    <button className="w-full flex items-center gap-1 text-indigo-600 text-sm hover:bg-indigo-50 rounded-lg px-2 py-1.5 transition-colors">
      <Plus size={14} /> 新增習慣
    </button>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add src/components/HabitSidebar.tsx
git commit -m "feat: HabitSidebar 升級視覺樣式"
```

---

### Task 10: 全面測試驗證

**Step 1: 執行完整單元測試**

```bash
cd timeblock/frontend && npm test -- --run --coverage 2>&1 | tail -30
```

Expected: 所有測試通過，覆蓋率 ≥ 80%

**Step 2: 啟動開發伺服器視覺確認**

```bash
cd timeblock/frontend && npm run dev &
```

確認以下項目：
- [ ] Sidebar 正確顯示深 indigo 背景
- [ ] NavLink active 狀態正確高亮
- [ ] DayView 正確顯示 Topbar 日期切換
- [ ] Modal 有 backdrop-blur 效果
- [ ] BlockCard 有左側色條與 hover 效果
- [ ] LoginPage 有漸層背景

**Step 3: E2E 測試（若環境可用）**

```bash
cd timeblock/frontend && npx playwright test --reporter=list 2>&1 | tail -20
```

**Step 4: 最終 commit**

```bash
git add -A
git commit -m "feat: 完成 TimeBlock UI 全面重設計（Sidebar Layout + indigo 主題）"
```

---

## 完成標準

- [ ] 所有頁面使用 AppLayout（Sidebar + Topbar）
- [ ] 舊版 `<nav>` 導覽列完全移除
- [ ] 單元測試覆蓋率 ≥ 80%
- [ ] TypeScript 無新增 error
- [ ] 視覺確認：Sidebar 深 indigo、主內容白底、BlockCard 色條樣式

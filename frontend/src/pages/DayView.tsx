// 日視圖頁面：24 小時時間軸，支援日期切換、習慣拖入、並排佈局
import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import TimeAxis from '../components/TimeAxis'
import HabitSidebar from '../components/HabitSidebar'
import DailyProgress from '../components/DailyProgress'
import { getBlocksByDate, createBlock, updateBlock } from '../api/blocks'
import type { TimeBlock } from '../api/blocks'
import { getHabits, createHabit } from '../api/habits'
import type { Habit } from '../api/habits'

/** 日視圖：顯示單日 24 小時時間塊，含習慣側邊欄並排佈局 */
export default function DayView() {
  const [searchParams] = useSearchParams()
  // 支援 URL ?date=YYYY-MM-DD 參數（從週/月視圖跳轉）
  const initialDate = searchParams.get('date')
    ? new Date(searchParams.get('date')!)
    : new Date()

  const [currentDate, setCurrentDate] = useState(initialDate)
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  // 載入狀態與錯誤訊息
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 習慣列表狀態
  const [habits, setHabits] = useState<Habit[]>([])
  // 新增習慣 Modal 狀態
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitTitle, setNewHabitTitle] = useState('')

  const dateStr = format(currentDate, 'yyyy-MM-dd')

  /** 重新載入當日時間塊，含錯誤處理 */
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

  /** 重新載入習慣列表 */
  const refreshHabits = useCallback(async () => {
    try {
      const data = await getHabits()
      setHabits(data)
    } catch (err) {
      console.error('載入習慣失敗', err)
    }
  }, [])

  useEffect(() => {
    refresh()
    refreshHabits()
  }, [refresh, refreshHabits])

  // dnd-kit 拖曳感測器：需移動 8px 才觸發（防止誤觸）
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  /** 統一處理所有拖曳結束事件：習慣拖入時間軸 + 時間塊拖曳移動 */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event

    // 1. 習慣拖入時間軸：active 是習慣，over 是小時格 droppable
    if (active.data.current?.type === 'habit' && over?.data.current?.hour !== undefined) {
      const habit = active.data.current.habit as Habit
      const dropHour = over.data.current.hour as number
      // 以本地時區建立時間，避免跨日問題
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

    // 2. 時間塊拖曳移動：active 是時間塊 id，根據 delta.y 計算新時間
    const block = blocks.find((b) => b.id === active.id)
    if (!block || Math.abs(delta.y) < 5) return  // 忽略微小位移

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

  /** 新增習慣並重整習慣列表 */
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

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-screen">
      {/* 導覽列 */}
      <nav className="flex gap-4 px-4 py-3 text-sm border-b bg-white sticky top-0 z-30">
        <Link to="/day" className="font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">日</Link>
        <Link to="/week" className="text-gray-500 hover:text-gray-900">週</Link>
        <Link to="/month" className="text-gray-500 hover:text-gray-900">月</Link>
        <Link to="/habits" className="text-gray-500 hover:text-gray-900">習慣</Link>
        <Link to="/templates" className="text-gray-500 hover:text-gray-900">範本</Link>
      </nav>

      {/* 日期切換標頭 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <button
          onClick={() => setCurrentDate((d) => subDays(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="前一天"
        >
          ‹
        </button>
        <div className="text-center">
          <h2 className="font-bold text-lg">
            {format(currentDate, 'M月d日', { locale: zhTW })}
          </h2>
          <p className="text-xs text-gray-400">
            {format(currentDate, 'yyyy年 EEEE', { locale: zhTW })}
          </p>
        </div>
        <button
          onClick={() => setCurrentDate((d) => addDays(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="後一天"
        >
          ›
        </button>
      </div>

      {/* 主體：習慣側邊欄 + 時間軸（共用一個 DndContext） */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* 習慣側邊欄：習慣列表可拖曳至時間軸 */}
          <HabitSidebar habits={habits} onAddHabit={() => setShowAddHabit(true)} />

          {/* 右側主要內容：進度條 + 時間軸 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DailyProgress blocks={blocks} />
            {loading && (
              <div className="flex items-center justify-center flex-1 text-gray-400">
                載入中...
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center flex-1 text-red-500">
                {error}
              </div>
            )}
            {!loading && !error && (
              <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl bg-white shadow-sm m-2">
                <TimeAxis date={dateStr} blocks={blocks} onRefresh={refresh} />
              </div>
            )}
          </div>
        </div>
      </DndContext>

      {/* 新增習慣 Modal */}
      {showAddHabit && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => { setShowAddHabit(false); setNewHabitTitle('') }}
        >
          <div
            className="bg-white rounded-xl p-6 w-80 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4">新增習慣</h3>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="習慣名稱（例如：晨跑、冥想）"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddHabit}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                新增
              </button>
              <button
                onClick={() => { setShowAddHabit(false); setNewHabitTitle('') }}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
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

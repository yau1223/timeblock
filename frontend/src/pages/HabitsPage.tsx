// 習慣追蹤頁面：今日習慣打勾、streak 顯示、新增習慣
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { getHabits, createHabit, toggleHabitLog, type Habit } from '../api/habits'

/** 習慣追蹤頁面：列出今日習慣並支援打勾完成 */
export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  // 今日各習慣的完成狀態（key: habit.id, value: boolean）
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)

  /** 載入習慣列表，含錯誤處理 */
  const refresh = async () => {
    try {
      const data = await getHabits()
      setHabits(data)
    } catch {
      console.error('載入習慣失敗')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  /** 切換習慣完成狀態並更新本地狀態，動態取得今日日期避免跨午夜問題 */
  const handleToggle = async (habit: Habit) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    try {
      const result = await toggleHabitLog(habit.id, today)
      setCompletedMap((prev) => ({ ...prev, [habit.id]: result.completed }))
    } catch {
      // 打勾失敗時不更新本地狀態，保持與後端一致
      console.error('習慣打勾失敗')
    }
  }

  /** 新增習慣 */
  const handleAdd = async () => {
    if (!newTitle.trim() || loading) return
    setLoading(true)
    try {
      await createHabit({ title: newTitle.trim(), color: '#10b981' })
      setNewTitle('')
      setShowAdd(false)
      refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* 導覽列 */}
      <nav className="flex gap-4 mb-4 text-sm border-b pb-3">
        <Link to="/day" className="text-gray-500 hover:text-gray-900">日</Link>
        <Link to="/week" className="text-gray-500 hover:text-gray-900">週</Link>
        <Link to="/month" className="text-gray-500 hover:text-gray-900">月</Link>
        <Link to="/habits" className="font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">習慣</Link>
        <Link to="/templates" className="text-gray-500 hover:text-gray-900">範本</Link>
      </nav>

      {/* 標頭 */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-bold text-lg">今日習慣</h2>
          <p className="text-xs text-gray-400">{format(new Date(), 'yyyy年M月d日')}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + 新增習慣
        </button>
      </div>

      {/* 習慣列表 */}
      {habits.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-lg mb-2">還沒有習慣</p>
          <p className="text-sm">點擊「+ 新增習慣」開始追蹤你的第一個習慣</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const done = completedMap[habit.id] ?? false
            return (
              <div
                key={habit.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
                }`}
              >
                {/* 習慣資訊 */}
                <div className="flex items-center gap-3">
                  {/* 顏色圓點 */}
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <div>
                    <div className={`font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {habit.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      連續 {habit.streak} 天
                    </div>
                  </div>
                </div>

                {/* 打勾按鈕 */}
                <button
                  onClick={() => handleToggle(habit)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  aria-label={done ? '取消完成' : '標記為完成'}
                >
                  {done && <span className="text-sm">✓</span>}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 新增習慣 Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-80 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4">新增習慣</h3>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="習慣名稱（例如：晨跑、冥想）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '新增中...' : '新增'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
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

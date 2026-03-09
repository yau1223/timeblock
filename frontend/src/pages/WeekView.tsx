// 週視圖頁面：7 天橫向排列，點擊跳至日視圖
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { getBlocksByDate, type TimeBlock } from '../api/blocks'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

/** 週視圖：橫向顯示 7 天的時間塊摘要 */
export default function WeekView() {
  const navigate = useNavigate()
  // 週的起始日（週一）
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  // 各日期對應的時間塊（key: YYYY-MM-DD）
  const [weekBlocks, setWeekBlocks] = useState<Record<string, TimeBlock[]>>({})

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    // 平行載入 7 天的時間塊
    Promise.all(
      days.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd')
        return getBlocksByDate(dateStr).then((blocks) => ({ dateStr, blocks }))
      })
    ).then((results) => {
      const map: Record<string, TimeBlock[]> = {}
      results.forEach(({ dateStr, blocks }) => { map[dateStr] = blocks })
      setWeekBlocks(map)
    })
  }, [weekStart])

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 導覽列 */}
      <nav className="flex gap-4 mb-4 text-sm border-b pb-3">
        <Link to="/day" className="text-gray-500 hover:text-gray-900">日</Link>
        <Link to="/week" className="font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">週</Link>
        <Link to="/month" className="text-gray-500 hover:text-gray-900">月</Link>
        <Link to="/habits" className="text-gray-500 hover:text-gray-900">習慣</Link>
        <Link to="/routines" className="text-gray-500 hover:text-gray-900">例行</Link>
        <Link to="/templates" className="text-gray-500 hover:text-gray-900">範本</Link>
        <Link to="/statistics" className="text-gray-500 hover:text-gray-900">統計</Link>
      </nav>

      {/* 週切換標頭 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekStart((d) => subWeeks(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="上一週"
        >
          ‹
        </button>
        <h2 className="font-bold text-lg">
          {format(weekStart, 'yyyy年 M月', { locale: zhTW })}
          <span className="text-sm font-normal text-gray-500 ml-2">
            第 {format(weekStart, 'w')} 週
          </span>
        </h2>
        <button
          onClick={() => setWeekStart((d) => addWeeks(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="下一週"
        >
          ›
        </button>
      </div>

      {/* 7 天格線 */}
      <div className="grid grid-cols-7 gap-1 border border-gray-100 rounded-xl bg-white shadow-sm p-2">
        {/* 星期標籤 */}
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs text-center font-bold text-gray-400 py-1">{d}</div>
        ))}

        {/* 每天的時間塊摘要 */}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const blocks = weekBlocks[dateStr] ?? []
          const isToday = dateStr === today

          return (
            <div
              key={dateStr}
              className={`min-h-24 p-1 rounded-lg cursor-pointer border transition-colors hover:bg-indigo-50 ${
                isToday ? 'border-indigo-300 bg-indigo-50' : 'border-transparent'
              }`}
              onClick={() => navigate(`/day?date=${dateStr}`)}
            >
              {/* 日期數字 */}
              <div className={`text-xs font-bold text-center mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
              {/* 前 3 筆時間塊 */}
              {blocks.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="text-xs rounded px-1 py-0.5 mb-0.5 truncate text-white"
                  style={{ backgroundColor: b.color }}
                >
                  {b.title}
                </div>
              ))}
              {/* 超過 3 筆的提示 */}
              {blocks.length > 3 && (
                <div className="text-xs text-gray-400">+{blocks.length - 3}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

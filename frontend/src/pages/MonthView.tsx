// 月視圖頁面：月曆格，點擊跳至日視圖
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { getBlocksByDate, type TimeBlock } from '../api/blocks'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

/** 月視圖：月曆格顯示，每格最多 2 筆時間塊 */
export default function MonthView() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(() => new Date())
  // 各日期對應的時間塊（key: YYYY-MM-DD）
  const [monthBlocks, setMonthBlocks] = useState<Record<string, TimeBlock[]>>({})

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  })

  useEffect(() => {
    // 平行載入當月所有日期的時間塊
    Promise.all(
      days.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd')
        return getBlocksByDate(dateStr).then((blocks) => ({ dateStr, blocks }))
      })
    ).then((results) => {
      const map: Record<string, TimeBlock[]> = {}
      results.forEach(({ dateStr, blocks }) => { map[dateStr] = blocks })
      setMonthBlocks(map)
    })
  }, [month])

  const today = format(new Date(), 'yyyy-MM-dd')

  // 計算月份第一天是週幾（週一為 0）
  const firstDayOfWeek = (getDay(days[0]) + 6) % 7

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 導覽列 */}
      <nav className="flex gap-4 mb-4 text-sm border-b pb-3">
        <Link to="/day" className="text-gray-500 hover:text-gray-900">日</Link>
        <Link to="/week" className="text-gray-500 hover:text-gray-900">週</Link>
        <Link to="/month" className="font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">月</Link>
        <Link to="/habits" className="text-gray-500 hover:text-gray-900">習慣</Link>
        <Link to="/routines" className="text-gray-500 hover:text-gray-900">例行</Link>
        <Link to="/templates" className="text-gray-500 hover:text-gray-900">範本</Link>
        <Link to="/statistics" className="text-gray-500 hover:text-gray-900">統計</Link>
      </nav>

      {/* 月切換標頭 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="上一月"
        >
          ‹
        </button>
        <h2 className="font-bold text-lg">
          {format(month, 'yyyy年 M月', { locale: zhTW })}
        </h2>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="下一月"
        >
          ›
        </button>
      </div>

      {/* 月曆格 */}
      <div className="border border-gray-100 rounded-xl bg-white shadow-sm p-2">
        {/* 星期標題列 */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-xs text-center font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* 日期格 */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* 補齊月份前的空格 */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`pad-${i}`} className="min-h-16" />
          ))}

          {/* 每天格子 */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const blocks = monthBlocks[dateStr] ?? []
            const isToday = dateStr === today

            return (
              <div
                key={dateStr}
                className={`min-h-16 p-1 rounded-lg cursor-pointer border transition-colors hover:bg-indigo-50 ${
                  isToday ? 'border-indigo-300 bg-indigo-50' : 'border-transparent'
                }`}
                onClick={() => navigate(`/day?date=${dateStr}`)}
              >
                {/* 日期數字 */}
                <div className={`text-xs font-bold mb-0.5 ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </div>
                {/* 前 2 筆時間塊 */}
                {blocks.slice(0, 2).map((b) => (
                  <div
                    key={b.id}
                    className="text-xs rounded px-1 py-0.5 mb-0.5 truncate text-white"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.title}
                  </div>
                ))}
                {blocks.length > 2 && (
                  <div className="text-xs text-gray-400">+{blocks.length - 2}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

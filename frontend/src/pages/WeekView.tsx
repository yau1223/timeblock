// 週視圖頁面：7 天橫向排列，點擊跳至日視圖
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getBlocksByDate, type TimeBlock } from '../api/blocks'
import Topbar from '../components/layout/Topbar'

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
    }).catch((err) => {
      console.error('載入週資料失敗', err)
    })
  }, [weekStart])

  const today = format(new Date(), 'yyyy-MM-dd')

  /** 切換至上一週 */
  const handlePrevWeek = () => setWeekStart((d) => subWeeks(d, 1))

  /** 切換至下一週 */
  const handleNextWeek = () => setWeekStart((d) => addWeeks(d, 1))

  /** 回到本週 */
  const handleThisWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  // 週範圍標籤（顯示年份與第幾週）
  const weekLabel = `${format(weekStart, 'yyyy年 M月', { locale: zhTW })} 第 ${format(weekStart, 'w')} 週`

  // Topbar 左側：週切換控制列
  const topbarLeft = (
    <>
      <button
        onClick={handlePrevWeek}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        aria-label="前一週"
      >
        <ChevronLeft size={18} />
      </button>
      <h1 className="font-semibold text-gray-900">{weekLabel}</h1>
      <button
        onClick={handleNextWeek}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        aria-label="後一週"
      >
        <ChevronRight size={18} />
      </button>
      <button
        onClick={handleThisWeek}
        className="text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1 hover:bg-indigo-50 transition-colors ml-2"
      >
        本週
      </button>
    </>
  )

  return (
    <div className="flex flex-col h-full">
      {/* 頂部操作欄 */}
      <Topbar left={topbarLeft} />

      {/* 主內容區 */}
      <div className="max-w-4xl mx-auto p-4 w-full">
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
    </div>
  )
}

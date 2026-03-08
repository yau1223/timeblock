// 日視圖頁面：24 小時時間軸，支援日期切換
import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import TimeAxis from '../components/TimeAxis'
import { getBlocksByDate } from '../api/blocks'
import type { TimeBlock } from '../api/blocks'

/** 日視圖：顯示單日 24 小時時間塊 */
export default function DayView() {
  const [searchParams] = useSearchParams()
  // 支援 URL ?date=YYYY-MM-DD 參數（從週/月視圖跳轉）
  const initialDate = searchParams.get('date')
    ? new Date(searchParams.get('date')!)
    : new Date()

  const [currentDate, setCurrentDate] = useState(initialDate)
  const [blocks, setBlocks] = useState<TimeBlock[]>([])

  const dateStr = format(currentDate, 'yyyy-MM-dd')

  /** 重新載入當日時間塊 */
  const refresh = useCallback(async () => {
    const data = await getBlocksByDate(dateStr)
    setBlocks(data)
  }, [dateStr])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* 導覽列 */}
      <nav className="flex gap-4 mb-4 text-sm border-b pb-3">
        <Link to="/day" className="font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">日</Link>
        <Link to="/week" className="text-gray-500 hover:text-gray-900">週</Link>
        <Link to="/month" className="text-gray-500 hover:text-gray-900">月</Link>
        <Link to="/habits" className="text-gray-500 hover:text-gray-900">習慣</Link>
      </nav>

      {/* 日期切換標頭 */}
      <div className="flex items-center justify-between mb-4">
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

      {/* 時間軸 */}
      <div
        className="overflow-y-auto border border-gray-100 rounded-xl bg-white shadow-sm"
        style={{ height: '70vh' }}
      >
        <TimeAxis date={dateStr} blocks={blocks} onRefresh={refresh} />
      </div>
    </div>
  )
}

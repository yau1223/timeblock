// 每日時間塊完成進度統計元件
import type { TimeBlock } from '../api/blocks'

interface DailyProgressProps {
  blocks: TimeBlock[]
}

/** 計算已排、已完成、空閒小時數並顯示三色進度條 */
export default function DailyProgress({ blocks }: DailyProgressProps) {
  // 計算總已排時數
  const scheduledHours = blocks.reduce((sum, b) => {
    return sum + (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000
  }, 0)

  // 計算已完成時數（有 completed_at 的時間塊）
  const completedHours = blocks.filter(b => b.completed_at).reduce((sum, b) => {
    return sum + (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000
  }, 0)

  // 空閒時數 = 24h - 已排時數
  const freeHours = Math.max(0, 24 - scheduledHours)
  const scheduledPct = Math.min(100, (scheduledHours / 24) * 100)
  const completedPct = Math.min(100, (completedHours / 24) * 100)

  return (
    <div className="px-4 py-2 bg-white border-b border-gray-100">
      <div className="flex gap-4 text-xs text-gray-500 mb-1">
        <span className="text-blue-500">已排 {scheduledHours.toFixed(1)}h</span>
        <span className="text-green-500">完成 {completedHours.toFixed(1)}h</span>
        <span className="text-gray-400">空閒 {freeHours.toFixed(1)}h</span>
      </div>
      {/* 三色進度條：灰底 + 藍色已排 + 綠色已完成（疊加） */}
      <div className="h-2 rounded-full bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-blue-200 rounded-full" style={{ width: `${scheduledPct}%` }} />
        <div className="absolute inset-y-0 left-0 bg-green-400 rounded-full" style={{ width: `${completedPct}%` }} />
      </div>
    </div>
  )
}

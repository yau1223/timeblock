// 時間塊卡片元件，支援拖曳（dnd-kit）
import { useDraggable } from '@dnd-kit/core'
import type { TimeBlock } from '../api/blocks'

// 每小時對應的像素高度
export const HOUR_HEIGHT = 64

/** 將 ISO datetime 轉換為距時間軸頂部的像素距離 */
export function timeToTopPx(isoTime: string): number {
  const d = new Date(isoTime)
  return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT
}

/** 計算時間塊的像素高度（依持續時間） */
export function durationToHeightPx(start: string, end: string): number {
  const diffHours = (new Date(end).getTime() - new Date(start).getTime()) / 3600000
  return Math.max(diffHours * HOUR_HEIGHT, 24)  // 最小高度 24px
}

interface BlockCardProps {
  block: TimeBlock
  topPx: number       // 距時間軸頂部的像素
  heightPx: number    // 時間塊高度像素
  onDelete: (id: string) => void
}

/** 可拖曳的時間塊卡片，點擊 × 刪除 */
export default function BlockCard({ block, topPx, heightPx, onDelete }: BlockCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: block.id })

  // 拖曳時套用 transform 位移
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={{
        top: topPx,
        height: heightPx,
        backgroundColor: block.color,
        ...style,
      }}
      className="absolute left-14 right-2 rounded-lg px-2 py-1 text-white text-xs cursor-grab active:cursor-grabbing overflow-hidden select-none shadow-sm z-10"
      {...listeners}
      {...attributes}
    >
      {/* 時間塊標題 */}
      <div className="font-semibold truncate pr-4">{block.title}</div>
      {/* 刪除按鈕 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(block.id)
        }}
        className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center opacity-70 hover:opacity-100 text-white"
        aria-label="刪除時間塊"
      >
        ×
      </button>
    </div>
  )
}

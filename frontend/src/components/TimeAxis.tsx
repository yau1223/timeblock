// 24 小時時間軸元件，支援點擊新增與拖曳調整時間塊
import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import BlockCard, { HOUR_HEIGHT, timeToTopPx, durationToHeightPx } from './BlockCard'
import { createBlock, updateBlock, deleteBlock } from '../api/blocks'
import type { TimeBlock } from '../api/blocks'

// 24 個小時標籤陣列
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface TimeAxisProps {
  date: string           // YYYY-MM-DD
  blocks: TimeBlock[]
  onRefresh: () => void  // 資料更新後的回呼
}

/** 24 小時時間軸，包含格線、時間塊、新增 modal */
export default function TimeAxis({ date, blocks, onRefresh }: TimeAxisProps) {
  // 新增時間塊 modal 狀態
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [clickedHour, setClickedHour] = useState(9)

  // 拖曳感測器：需移動 8px 才觸發拖曳（防止誤觸）
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  /** 點擊時間軸空白處：計算點擊的小時並顯示新增 modal */
  const handleAxisClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 若點擊的是時間塊本身則忽略
    if ((e.target as HTMLElement).closest('[data-dnd-kit]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const hour = Math.max(0, Math.min(23, Math.floor(y / HOUR_HEIGHT)))
    setClickedHour(hour)
    setShowModal(true)
  }

  /** 新增時間塊（預設 1 小時長度） */
  const handleCreate = async () => {
    // 不加 Z，讓 JS 以本地時區（台灣 UTC+8）解析，toISOString() 再轉成 UTC 送後端
    const startDate = new Date(`${date}T${String(clickedHour).padStart(2, '0')}:00:00`)
    const endDate = new Date(startDate.getTime() + 3600000)

    await createBlock({
      title: newTitle.trim() || '新時間塊',
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      color: '#6366f1',
    })

    setShowModal(false)
    setNewTitle('')
    onRefresh()
  }

  /** 拖曳結束：計算位移的小時數並更新時間塊時間 */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event
    const block = blocks.find((b) => b.id === active.id)
    if (!block || Math.abs(delta.y) < 5) return  // 忽略微小位移

    const deltaMs = (delta.y / HOUR_HEIGHT) * 3600000
    const newStart = new Date(new Date(block.start_time).getTime() + deltaMs)
    const newEnd = new Date(new Date(block.end_time).getTime() + deltaMs)

    await updateBlock(String(active.id), {
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    })
    onRefresh()
  }

  /** 刪除時間塊 */
  const handleDelete = async (id: string) => {
    await deleteBlock(id)
    onRefresh()
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* 時間軸容器 */}
        <div
          className="relative select-none"
          style={{ height: HOUR_HEIGHT * 24 }}
          onClick={handleAxisClick}
        >
          {/* 小時格線與標籤 */}
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full border-t border-gray-100"
              style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <span className="absolute left-2 -top-2 text-xs text-gray-400 w-10 text-right">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* 時間塊列表 */}
          {blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              topPx={timeToTopPx(block.start_time)}
              heightPx={durationToHeightPx(block.start_time, block.end_time)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>

      {/* 新增時間塊 Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-80 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg mb-1">新增時間塊</h2>
            <p className="text-sm text-gray-500 mb-4">
              {String(clickedHour).padStart(2, '0')}:00 — {String(clickedHour + 1).padStart(2, '0')}:00
            </p>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="標題（選填）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                新增
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

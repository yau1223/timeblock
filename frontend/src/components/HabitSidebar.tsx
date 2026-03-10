// 可拖曳習慣側邊欄元件
import { Plus } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import type { Habit } from '../api/habits'

interface DraggableHabitItemProps {
  habit: Habit
}

/** 可拖曳的單一習慣列項 */
function DraggableHabitItem({ habit }: DraggableHabitItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `habit-${habit.id}`,
    data: { type: 'habit', habit },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? 'opacity-40' : 'hover:bg-indigo-50'
      }`}
    >
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
      <span className="text-sm truncate flex-1">{habit.title}</span>
      <span className="text-xs text-gray-400">🔥{habit.streak}</span>
    </div>
  )
}

interface HabitSidebarProps {
  habits: Habit[]
  onAddHabit: () => void
}

/** 習慣側邊欄：顯示可拖曳的習慣列表 */
export default function HabitSidebar({ habits, onAddHabit }: HabitSidebarProps) {
  return (
    <div className="w-44 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col h-full">
      {/* 標題區 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">習慣</h3>
      </div>
      {/* 習慣列表區 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {habits.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">尚無習慣</p>
        ) : (
          habits.map(h => <DraggableHabitItem key={h.id} habit={h} />)
        )}
      </div>
      {/* 新增按鈕區 */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onAddHabit}
          className="w-full flex items-center justify-center gap-1 text-indigo-600 text-sm hover:bg-indigo-50 rounded-lg px-2 py-1.5 transition-colors"
        >
          <Plus size={14} /> 新增習慣
        </button>
      </div>
    </div>
  )
}

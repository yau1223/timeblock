// 可拖曳習慣側邊欄元件
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
        isDragging ? 'opacity-40' : 'hover:bg-gray-50'
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
    <div className="w-40 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">習慣</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {habits.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">尚無習慣</p>
        ) : (
          habits.map(h => <DraggableHabitItem key={h.id} habit={h} />)
        )}
      </div>
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={onAddHabit}
          className="w-full text-xs text-indigo-600 hover:text-indigo-800 py-1.5 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          + 新增習慣
        </button>
      </div>
    </div>
  )
}

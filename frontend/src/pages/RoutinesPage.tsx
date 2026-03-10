// 例行事項管理頁面：列出、新增、編輯、刪除例行事項
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import {
  getRoutines, createRoutine, updateRoutine, deleteRoutine, applyRoutine,
  type Routine, type RoutineCreate,
} from '../api/routines'
import Topbar from '../components/layout/Topbar'

/** 星期標籤：0=日, 1=一 ... 6=六 */
const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/** 預設新增表單值 */
const DEFAULT_FORM: RoutineCreate = {
  title: '',
  color: '#f59e0b',
  start_time: '08:00:00',
  duration: 60,
  days_of_week: [1, 2, 3, 4, 5],
  auto_generate: false,
}

/** 例行事項管理頁面 */
export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RoutineCreate>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [appliedId, setAppliedId] = useState<string | null>(null)

  /** 載入例行事項列表 */
  const refresh = async () => {
    try {
      const data = await getRoutines()
      setRoutines(data)
    } catch {
      console.error('載入例行事項失敗')
    }
  }

  useEffect(() => { refresh() }, [])

  /** 開啟新增 Modal */
  const handleOpenAdd = () => {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setShowModal(true)
  }

  /** 開啟編輯 Modal */
  const handleOpenEdit = (r: Routine) => {
    setEditingId(r.id)
    setForm({
      title: r.title,
      icon: r.icon,
      color: r.color,
      start_time: r.start_time,
      duration: r.duration,
      days_of_week: r.days_of_week,
      auto_generate: r.auto_generate,
    })
    setShowModal(true)
  }

  /** 儲存（新增或更新） */
  const handleSave = async () => {
    if (!form.title.trim() || loading) return
    setLoading(true)
    try {
      if (editingId) {
        await updateRoutine(editingId, form)
      } else {
        await createRoutine(form)
      }
      setShowModal(false)
      refresh()
    } finally {
      setLoading(false)
    }
  }

  /** 刪除例行事項 */
  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此例行事項？')) return
    await deleteRoutine(id)
    refresh()
  }

  /** 手動套用到今日 */
  const handleApply = async (id: string) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    await applyRoutine(id, today)
    setAppliedId(id)
    setTimeout(() => setAppliedId(null), 2000)
  }

  /** 切換重複星期 */
  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week?.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...(prev.days_of_week ?? []), day],
    }))
  }

  return (
    <div className="flex flex-col h-full">
      {/* 頂部操作欄：標題與新增按鈕 */}
      <Topbar
        left={<h1 className="font-semibold text-xl text-gray-900">例行事項</h1>}
        right={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> 新增例行事項
          </button>
        }
      />

      {/* 主內容區 */}
      <div className="px-6 py-4">
        {/* 列表 */}
        {routines.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">尚無例行事項，點擊「新增」開始建立</p>
        ) : (
          <ul className="space-y-3">
            {routines.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.title}</p>
                  <p className="text-xs text-gray-400">
                    {r.start_time.slice(0, 5)} · {r.duration} 分鐘 ·{' '}
                    {r.days_of_week.length === 0
                      ? '每天'
                      : r.days_of_week.map((d) => `週${DAY_LABELS[d]}`).join('、')}
                    {r.auto_generate && <span className="ml-1 text-amber-500">自動</span>}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleApply(r.id)}
                    className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    {appliedId === r.id ? '✓' : '套用今日'}
                  </button>
                  <button onClick={() => handleOpenEdit(r)} className="p-1 text-gray-400 hover:text-gray-700 text-xs">✎</button>
                  <button onClick={() => handleDelete(r.id)} className="p-1 text-gray-400 hover:text-red-500 text-xs">✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 新增/編輯 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-4">{editingId ? '編輯例行事項' : '新增例行事項'}</h3>
            <div className="space-y-3">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="例行事項名稱"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">開始時間</label>
                  <input
                    type="time"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.start_time?.slice(0, 5)}
                    onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value + ':00' }))}
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-gray-500 mb-1 block">時長（分）</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.duration}
                    min={5}
                    max={480}
                    onChange={(e) => setForm((p) => ({ ...p, duration: parseInt(e.target.value) || 60 }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">顏色</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">重複星期（不選 = 每天）</label>
                <div className="flex gap-1">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        form.days_of_week?.includes(i)
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.auto_generate}
                  onChange={(e) => setForm((p) => ({ ...p, auto_generate: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">自動生成到每日時間軸</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 bg-amber-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

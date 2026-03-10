// 範本時間表頁面：列出、建立、套用、刪除排程範本
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getTemplates, createTemplate, deleteTemplate, type Template } from '../api/templates'
import { createBlock, getBlocksByDate } from '../api/blocks'
import Topbar from '../components/layout/Topbar'

/** 範本時間表頁面 */
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  // 另存為範本
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  // 套用範本
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  /** 重新載入範本列表 */
  const refresh = async () => {
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('載入範本失敗', err)
    }
  }

  useEffect(() => { refresh() }, [])

  /** 從今日排程另存為範本 */
  const handleSaveToday = async () => {
    if (!templateName.trim()) return
    setLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const blocks = await getBlocksByDate(today)
      const dayStart = new Date(`${today}T00:00:00`)

      const templateBlocks = blocks.map(b => ({
        title: b.title,
        color: b.color,
        offset_minutes: Math.round((new Date(b.start_time).getTime() - dayStart.getTime()) / 60000),
        duration_minutes: Math.round((new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 60000),
        habit_id: b.habit_id,
      }))

      await createTemplate({ name: templateName.trim(), blocks: templateBlocks })
      setTemplateName('')
      setShowSaveModal(false)
      refresh()
    } catch (err) {
      console.error('另存範本失敗', err)
    } finally {
      setLoading(false)
    }
  }

  /** 套用範本到指定日期 */
  const handleApply = async (template: Template) => {
    if (!targetDate) return
    setLoading(true)
    try {
      const dayStart = new Date(`${targetDate}T00:00:00`)
      await Promise.all(template.blocks.map(b => {
        const start = new Date(dayStart.getTime() + b.offset_minutes * 60000)
        const end = new Date(start.getTime() + b.duration_minutes * 60000)
        return createBlock({
          title: b.title,
          color: b.color,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          habit_id: b.habit_id,
        })
      }))
      setApplyingId(null)
      alert(`已套用「${template.name}」到 ${targetDate}`)
    } catch (err) {
      console.error('套用範本失敗', err)
    } finally {
      setLoading(false)
    }
  }

  /** 刪除範本 */
  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此範本？')) return
    try {
      await deleteTemplate(id)
      refresh()
    } catch (err) {
      console.error('刪除範本失敗', err)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 頂部操作欄：標題（範本庫無通用新增按鈕，以 Modal 形式另存） */}
      <Topbar
        left={<h1 className="font-semibold text-xl text-gray-900">範本庫</h1>}
        right={
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + 從今日另存
          </button>
        }
      />

      {/* 主內容區 */}
      <div className="px-6 py-4">
        {/* 範本列表 */}
        {templates.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-lg mb-2">還沒有範本</p>
            <p className="text-sm">點擊「+ 從今日另存」將今日排程存為範本</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{t.blocks.length} 個時間塊</p>
                  </div>
                  <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-400 text-lg">×</button>
                </div>

                {/* 時間塊色塊預覽 */}
                <div className="flex gap-1 flex-wrap mb-3">
                  {t.blocks.map((b, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: b.color }}>
                      {b.title}
                    </span>
                  ))}
                </div>

                {/* 套用區域 */}
                {applyingId === t.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm flex-1"
                    />
                    <button
                      onClick={() => handleApply(t)}
                      disabled={loading}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                      套用
                    </button>
                    <button onClick={() => setApplyingId(null)} className="text-gray-400 hover:text-gray-600 text-sm">取消</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setApplyingId(t.id)}
                    className="w-full text-sm text-indigo-600 hover:text-indigo-800 py-1.5 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50"
                  >
                    套用到某天
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 另存為範本 Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">另存為範本</h3>
            <p className="text-sm text-gray-500 mb-3">將今日的排程存為可重複套用的範本</p>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="範本名稱（例如：工作日、週末）"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveToday()}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleSaveToday} disabled={loading || !templateName.trim()} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? '儲存中...' : '儲存'}
              </button>
              <button onClick={() => setShowSaveModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

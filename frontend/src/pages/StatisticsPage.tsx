// 統計頁面：時間分配圓餅/長條圖 + 習慣完成率進度條 + GitHub 風格熱力圖
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import {
  getTimeDistribution, getHabitsCompletion, getHabitHeatmap,
  type TimeDistributionItem, type HabitCompletion, type HeatmapData, type StatRange,
} from '../api/statistics'
import Topbar from '../components/layout/Topbar'

/** 圖表配色 */
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

/** 取得指定年份所有日期（用於熱力圖） */
function getYearDates(year: number): string[] {
  const dates: string[] = []
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    dates.push(format(d, 'yyyy-MM-dd'))
  }
  return dates
}

/** 統計頁面主元件 */
export default function StatisticsPage() {
  const [range, setRange] = useState<StatRange>('week')
  const [baseDate, setBaseDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [distribution, setDistribution] = useState<TimeDistributionItem[]>([])
  const [completion, setCompletion] = useState<HabitCompletion[]>([])
  const [selectedHabit, setSelectedHabit] = useState<HabitCompletion | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData>({})
  const [loading, setLoading] = useState(false)

  /** 載入時間分配與習慣完成率 */
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [dist, comp] = await Promise.all([
          getTimeDistribution(range, baseDate),
          getHabitsCompletion(range, baseDate),
        ])
        setDistribution(dist)
        setCompletion(comp)
        setSelectedHabit(null)
        setHeatmap({})
      } catch {
        console.error('統計載入失敗')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [range, baseDate])

  /** 載入熱力圖 */
  const loadHeatmap = async (habit: HabitCompletion) => {
    if (selectedHabit?.habit_id === habit.habit_id) {
      setSelectedHabit(null)
      setHeatmap({})
      return
    }
    setSelectedHabit(habit)
    const year = new Date(baseDate).getFullYear()
    const data = await getHabitHeatmap(habit.habit_id, year)
    setHeatmap(data)
  }

  /** 產生熱力圖格狀週數據 */
  const yearDates = getYearDates(new Date(baseDate).getFullYear())
  const weeks: string[][] = []
  let week: string[] = []
  const firstDayOfYear = new Date(yearDates[0]).getDay()
  for (let i = 0; i < firstDayOfYear; i++) week.push('')
  for (const d of yearDates) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length) weeks.push(week)

  return (
    <div className="flex flex-col h-full">
      {/* 頂部操作欄：標題與日期範圍選擇器 */}
      <Topbar
        left={<h1 className="font-semibold text-xl text-gray-900">統計分析</h1>}
        right={
          <div className="flex items-center gap-3">
            {/* 範圍切換按鈕組 */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(['day', 'week', 'month'] as StatRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${range === r ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {{ day: '日', week: '週', month: '月' }[r]}
                </button>
              ))}
            </div>
            {/* 基準日期選擇 */}
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            />
          </div>
        }
      />

      {/* 主內容區 */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">載入中...</div>
        ) : (
          <div className="space-y-8">
            {/* 時間分配 */}
            <section>
              <h3 className="font-bold text-base mb-4">時間分配</h3>
              {distribution.length === 0 ? (
                <p className="text-gray-400 text-sm">此期間無時間塊資料</p>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div style={{ width: 220, height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distribution} dataKey="minutes" nameKey="category" cx="50%" cy="50%" outerRadius={90}>
                          {distribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} 分鐘`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distribution} layout="vertical" margin={{ left: 8 }}>
                        <XAxis type="number" unit=" 分" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={60} />
                        <Tooltip formatter={(v) => [`${v} 分鐘`]} />
                        <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                          {distribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </section>

            {/* 習慣完成率 */}
            <section>
              <h3 className="font-bold text-base mb-4">習慣完成率</h3>
              {completion.length === 0 ? (
                <p className="text-gray-400 text-sm">尚無習慣資料</p>
              ) : (
                <ul className="space-y-3">
                  {completion.map((h) => (
                    <li
                      key={h.habit_id}
                      className="cursor-pointer rounded-xl p-3 border border-gray-100 hover:border-indigo-200 transition-colors"
                      onClick={() => loadHeatmap(h)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                          {h.title}
                        </span>
                        <span className="text-xs text-gray-500">{h.completed}/{h.total} 天（{h.rate}%）</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${h.rate}%`, backgroundColor: h.color }}
                        />
                      </div>
                      {/* 熱力圖（點擊習慣展開） */}
                      {selectedHabit?.habit_id === h.habit_id && (
                        <div className="mt-3 overflow-x-auto">
                          <p className="text-xs text-gray-400 mb-2">{new Date(baseDate).getFullYear()} 年全年完成記錄（點擊收起）</p>
                          <div className="flex gap-0.5">
                            {weeks.map((w, wi) => (
                              <div key={wi} className="flex flex-col gap-0.5">
                                {w.map((d, di) => (
                                  <div
                                    key={di}
                                    className="w-2.5 h-2.5 rounded-sm"
                                    style={{
                                      backgroundColor: !d
                                        ? 'transparent'
                                        : heatmap[d] === true
                                        ? h.color
                                        : '#e5e7eb',
                                    }}
                                    title={d}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

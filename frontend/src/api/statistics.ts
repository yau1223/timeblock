// 統計資料 API 呼叫函式
import apiClient from './client'

// 時間分配資料型別
export interface TimeDistributionItem {
  category: string
  minutes: number
}

// 習慣完成率資料型別
export interface HabitCompletion {
  habit_id: string
  title: string
  color: string
  completed: number
  total: number
  rate: number
}

// 熱力圖資料型別：{ "2026-01-01": true, "2026-01-02": false, ... }
export type HeatmapData = Record<string, boolean>

export type StatRange = 'day' | 'week' | 'month'

/** 查詢時間分配統計 */
export async function getTimeDistribution(range: StatRange, date: string): Promise<TimeDistributionItem[]> {
  const res = await apiClient.get('/api/statistics/time-distribution', { params: { range, date } })
  return res.data
}

/** 查詢習慣完成率統計 */
export async function getHabitsCompletion(range: StatRange, date: string): Promise<HabitCompletion[]> {
  const res = await apiClient.get('/api/statistics/habits/completion', { params: { range, date } })
  return res.data
}

/** 查詢單一習慣全年熱力圖資料 */
export async function getHabitHeatmap(habitId: string, year: number): Promise<HeatmapData> {
  const res = await apiClient.get('/api/statistics/habits/heatmap', {
    params: { habit_id: habitId, year },
  })
  return res.data
}

// 習慣管理 API 呼叫函式
import apiClient from './client'

// 習慣資料型別
export interface Habit {
  id: string
  title: string
  icon?: string
  color: string
  frequency: string
  duration: number
  is_active: boolean
  streak: number
}

// 習慣打勾記錄型別
export interface HabitLog {
  date: string
  completed: boolean
}

/** 取得使用者所有啟用中的習慣（含 streak） */
export async function getHabits(): Promise<Habit[]> {
  const res = await apiClient.get('/api/habits/')
  return res.data
}

/** 新增習慣 */
export async function createHabit(data: Pick<Habit, 'title' | 'color'> & { duration?: number }): Promise<Habit> {
  const res = await apiClient.post('/api/habits/', data)
  return res.data
}

/** 切換指定日期的習慣完成狀態（打勾/取消） */
export async function toggleHabitLog(habitId: string, date: string): Promise<HabitLog> {
  const res = await apiClient.post(`/api/habits/${habitId}/logs/${date}`)
  return res.data
}

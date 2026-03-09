// 例行事項管理 API 呼叫函式
import apiClient from './client'

// 例行事項資料型別
export interface Routine {
  id: string
  title: string
  icon?: string
  color: string
  start_time: string  // "HH:MM:SS"
  duration: number
  days_of_week: number[]
  auto_generate: boolean
  is_active: boolean
}

export interface RoutineCreate {
  title: string
  icon?: string
  color?: string
  start_time: string
  duration?: number
  days_of_week?: number[]
  auto_generate?: boolean
}

/** 取得所有啟用中的例行事項 */
export async function getRoutines(): Promise<Routine[]> {
  const res = await apiClient.get('/api/routines/')
  return res.data
}

/** 新增例行事項 */
export async function createRoutine(data: RoutineCreate): Promise<Routine> {
  const res = await apiClient.post('/api/routines/', data)
  return res.data
}

/** 更新例行事項（部分更新） */
export async function updateRoutine(id: string, data: Partial<RoutineCreate>): Promise<Routine> {
  const res = await apiClient.patch(`/api/routines/${id}`, data)
  return res.data
}

/** 刪除例行事項 */
export async function deleteRoutine(id: string): Promise<void> {
  await apiClient.delete(`/api/routines/${id}`)
}

/** 手動套用例行事項到指定日期 */
export async function applyRoutine(id: string, targetDate: string): Promise<{ created: boolean }> {
  const res = await apiClient.post(`/api/routines/${id}/apply`, null, {
    params: { target_date: targetDate },
  })
  return res.data
}

/** 自動生成指定日期的例行事項時間塊（前端在 DayView 載入時呼叫） */
export async function autoGenerateRoutines(targetDate: string): Promise<{ generated: number; skipped: number }> {
  const res = await apiClient.get('/api/routines/auto-generate', {
    params: { target_date: targetDate },
  })
  return res.data
}

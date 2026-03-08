// 時間塊 CRUD API 呼叫函式
import apiClient from './client'

// 時間塊資料型別
export interface TimeBlock {
  id: string
  title: string
  color: string
  start_time: string    // ISO 8601 datetime string
  end_time: string      // ISO 8601 datetime string
  description?: string
  category_id?: string
  habit_id?: string
  is_recurring: boolean
  recur_rule?: string
  completed_at?: string | null
}

/** 取得指定日期的所有時間塊（YYYY-MM-DD 格式）
 *  以本地時間午夜為邊界轉成 UTC，避免台灣 UTC+8 跨日問題 */
export async function getBlocksByDate(date: string): Promise<TimeBlock[]> {
  const start = new Date(`${date}T00:00:00`).toISOString()
  const end = new Date(`${date}T23:59:59`).toISOString()
  const res = await apiClient.get('/api/blocks/', { params: { start, end } })
  return res.data
}

/** 取得指定時間範圍的所有時間塊 */
export async function getBlocksByRange(start: string, end: string): Promise<TimeBlock[]> {
  const res = await apiClient.get('/api/blocks/', { params: { start, end } })
  return res.data
}

/** 新增時間塊 */
export async function createBlock(data: Omit<TimeBlock, 'id' | 'is_recurring'>): Promise<TimeBlock> {
  const res = await apiClient.post('/api/blocks/', { ...data, is_recurring: false })
  return res.data
}

/** 更新時間塊（支援部分更新，用於拖曳後的時間調整） */
export async function updateBlock(id: string, data: Partial<Omit<TimeBlock, 'id'>>): Promise<TimeBlock> {
  const res = await apiClient.patch(`/api/blocks/${id}`, data)
  return res.data
}

/** 刪除時間塊 */
export async function deleteBlock(id: string): Promise<void> {
  await apiClient.delete(`/api/blocks/${id}`)
}

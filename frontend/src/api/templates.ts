// 範本時間表 CRUD API
import apiClient from './client'

/** 範本內的單一時間塊資料 */
export interface TemplateBlock {
  title: string
  color: string
  offset_minutes: number   // 從當日 00:00 起的分鐘偏移
  duration_minutes: number
  habit_id?: string
}

/** 範本資料型別 */
export interface Template {
  id: string
  name: string
  blocks: TemplateBlock[]
  created_at: string
}

/** 取得所有範本 */
export async function getTemplates(): Promise<Template[]> {
  return (await apiClient.get('/api/templates/')).data
}

/** 建立新範本 */
export async function createTemplate(data: { name: string; blocks: TemplateBlock[] }): Promise<Template> {
  return (await apiClient.post('/api/templates/', data)).data
}

/** 刪除範本 */
export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/api/templates/${id}`)
}

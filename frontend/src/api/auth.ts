// 認證相關 API 呼叫函式
import apiClient from './client'

// 使用者資訊型別
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  auth_provider: string
}

// Token 回應型別
interface TokenResponse {
  access_token: string
  token_type: string
}

/** 使用者登入，回傳 JWT access token */
export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await apiClient.post('/api/auth/login', { email, password })
  return res.data
}

/** 使用者註冊，回傳 JWT access token */
export async function register(email: string, password: string, name: string): Promise<TokenResponse> {
  const res = await apiClient.post('/api/auth/register', { email, password, name })
  return res.data
}

/** 取得目前登入使用者資訊 */
export async function getMe(): Promise<User> {
  const res = await apiClient.get('/api/auth/me')
  return res.data
}

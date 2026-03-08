// 全域認證狀態管理（Zustand）
import { create } from 'zustand'

// 使用者資訊型別
interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  auth_provider: string
}

// 認證狀態型別
interface AuthState {
  user: User | null
  token: string | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

// 認證狀態 store，token 持久化至 localStorage
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  setAuth: (token, user) => {
    localStorage.setItem('access_token', token)
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    set({ token: null, user: null })
  },
}))

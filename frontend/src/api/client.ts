// Axios API client，自動附加 JWT token 與處理 401 跳轉
import axios from 'axios'

// 從環境變數讀取後端 API 位址
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

// 請求攔截器：自動附加 Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 回應攔截器：僅當請求帶有 token 且收到 401 時，才清除 token 並跳轉登入頁
// 登入/註冊頁面本身呼叫 API 失敗（401）時，不應觸發自動跳轉，讓頁面元件自行顯示錯誤訊息
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const hadToken = !!localStorage.getItem('access_token')
    if (error.response?.status === 401 && hadToken) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

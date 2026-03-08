// 登入/註冊頁面，支援 Email 表單切換
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { login, register, getMe } from '../api/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  // 模式切換：登入 or 註冊
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /** 表單提交：登入或註冊後取得使用者資訊並儲存 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = isLogin
        ? await login(email, password)
        : await register(email, password, name)

      // 暫存 token 以便 getMe 能帶入 Authorization header
      localStorage.setItem('access_token', access_token)
      const user = await getMe()
      setAuth(access_token, user)
      navigate('/day')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        setError(axiosErr.response?.data?.detail ?? '操作失敗，請稍後再試')
      } else {
        setError('網路連線異常，請稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm border border-gray-100">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">TimeBlock 時間塊</h1>
          <p className="text-sm text-gray-500 mt-1">管理你的時間，養成好習慣</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名稱欄位（僅註冊時顯示） */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名稱</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="你的名字"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          {/* Email 欄位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 密碼欄位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* 提交按鈕 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '處理中...' : isLogin ? '登入' : '建立帳號'}
          </button>
        </form>

        {/* 切換登入/註冊 */}
        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="text-sm text-indigo-600 hover:underline"
          >
            {isLogin ? '還沒有帳號？立即註冊' : '已有帳號？直接登入'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 登入/註冊頁面，支援 Email 表單切換
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        {/* Logo 區域 */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Clock size={28} className="text-indigo-600" />
          <span className="text-2xl font-bold text-gray-900">TimeBlock</span>
        </div>

        {/* 標題與副標 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {isLogin ? '歡迎回來' : '建立帳號'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isLogin ? '請登入您的帳號' : '開始管理您的時間'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名稱欄位（僅註冊時顯示） */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名稱</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <p className="text-red-500 text-sm mb-4">
              {error}
            </p>
          )}

          {/* 提交按鈕 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '處理中...' : isLogin ? '登入' : '建立帳號'}
          </button>
        </form>

        {/* 切換登入/註冊 */}
        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {isLogin ? '還沒有帳號？立即註冊' : '已有帳號？直接登入'}
          </button>
        </div>
      </div>
    </div>
  )
}

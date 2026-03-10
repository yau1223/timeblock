// src/components/layout/Sidebar.tsx
// 全域左側導覽欄，深 indigo 背景，包含 Logo、頁面導覽、使用者資訊
import { NavLink, useNavigate } from 'react-router-dom'
import {
  CalendarDays, CalendarRange, Calendar, CheckSquare,
  RefreshCw, LayoutTemplate, BarChart2, LogOut, Clock
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

/** 單一導覽項目 */
function NavItem({
  to, icon: Icon, label
}: {
  to: string
  icon: React.ElementType
  label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

/** 左側固定導覽列 */
export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  /** 登出並跳轉登入頁 */
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-[220px] h-screen bg-[#1E1B4B] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo 區 */}
      <div className="px-6 py-5 border-b border-indigo-800">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-indigo-400" />
          <span className="text-white font-bold text-lg">TimeBlock</span>
        </div>
      </div>

      {/* 導覽列表 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/day" icon={CalendarDays} label="日視圖" />
        <NavItem to="/week" icon={CalendarRange} label="週視圖" />
        <NavItem to="/month" icon={Calendar} label="月視圖" />
        <div className="pt-3 pb-1">
          <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            管理
          </p>
        </div>
        <NavItem to="/habits" icon={CheckSquare} label="習慣" />
        <NavItem to="/routines" icon={RefreshCw} label="例行事項" />
        <NavItem to="/templates" icon={LayoutTemplate} label="範本" />
        <NavItem to="/statistics" icon={BarChart2} label="統計" />
      </nav>

      {/* 底部使用者區 */}
      <div className="px-4 py-4 border-t border-indigo-800">
        {user && (
          <div className="mb-3 px-1">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-indigo-300 text-xs truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors w-full px-1"
        >
          <LogOut size={16} />
          登出
        </button>
      </div>
    </aside>
  )
}

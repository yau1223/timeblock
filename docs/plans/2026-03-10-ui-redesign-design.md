# TimeBlock UI 全面重設計 設計文件

**日期**：2026-03-10
**狀態**：已核准，待實作
**範圍**：全面重設計（Layout、導覽、配色、所有頁面元件）

---

## 設計目標

將 TimeBlock 從基本功能性 UI 升級為現代亮色生產力工具風格，參考 Google Calendar 的清晰層次與空間利用，採用左側固定 Sidebar + 白色主內容區佈局。

---

## 整體 Layout 架構

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (220px fixed)  │  Main Content Area          │
│                        │                             │
│  ┌──────────────────┐  │  ┌─────────────────────┐   │
│  │  🕐 TimeBlock    │  │  │  Topbar (日期+操作) │   │
│  └──────────────────┘  │  └─────────────────────┘   │
│                        │                             │
│  ─ 主要導覽 ─          │  ┌─────────────────────┐   │
│  📅 日視圖  [active]   │  │                     │   │
│  📆 週視圖             │  │   頁面內容區域       │   │
│  🗓 月視圖             │  │   (scrollable)       │   │
│  ✅ 習慣               │  │                     │   │
│  🔄 例行事項           │  └─────────────────────┘   │
│  📋 範本               │                             │
│  📊 統計               │                             │
│                        │                             │
│  ─ 底部 ─              │                             │
│  👤 使用者名稱          │                             │
│  🚪 登出               │                             │
└─────────────────────────────────────────────────────┘
```

- **Sidebar**：220px 固定寬度，背景 `#1E1B4B`（深 indigo）
- **Main Content**：剩餘空間，背景 `#F8FAFC`（極淡灰白）
- **Topbar**：白底，高度 64px，每頁內容不同

---

## 色彩系統

| 用途 | 色票 | Tailwind 對應 |
|------|------|---------------|
| Sidebar 背景 | `#1E1B4B` | `indigo-950` |
| 主要強調色 | `#4F46E5` | `indigo-600` |
| 輕量強調色 | `#EEF2FF` | `indigo-50` |
| 頁面背景 | `#F8FAFC` | `slate-50` |
| 卡片背景 | `#FFFFFF` | `white` |
| 主文字 | `#111827` | `gray-900` |
| 次要文字 | `#6B7280` | `gray-500` |
| 邊框 | `#E5E7EB` | `gray-200` |
| 危險/刪除 | `#EF4444` | `red-500` |

---

## 排版系統

| 層級 | 大小 | 字重 | 用途 |
|------|------|------|------|
| Display | 24px / `text-2xl` | 700 | 頁面大標題 |
| Title | 18px / `text-lg` | 600 | 區塊標題 |
| Body | 14px / `text-sm` | 400 | 一般內文 |
| Caption | 12px / `text-xs` | 400 | 時間標籤、說明文字 |
| Label | 13px / `text-[13px]` | 500 | 按鈕、Badge |

---

## 核心元件規格

### Sidebar

```tsx
// 深 indigo 背景，固定左側
<aside className="w-[220px] h-screen bg-[#1E1B4B] flex flex-col fixed left-0 top-0">
  {/* Logo 區 */}
  <div className="px-6 py-5 border-b border-indigo-800">
    <span className="text-white font-bold text-lg">🕐 TimeBlock</span>
  </div>

  {/* 導覽列表 */}
  <nav className="flex-1 px-3 py-4 space-y-1">
    {/* Active 狀態 */}
    <NavItem icon="📅" label="日視圖" active />
    {/* Inactive 狀態 */}
    <NavItem icon="📆" label="週視圖" />
    {/* ... */}
  </nav>

  {/* 底部使用者區 */}
  <div className="px-4 py-4 border-t border-indigo-800">
    <UserInfo />
    <LogoutButton />
  </div>
</aside>
```

**NavItem 樣式：**
- Active：`bg-indigo-600 text-white rounded-lg px-3 py-2`
- Inactive：`text-indigo-200 hover:bg-indigo-800 rounded-lg px-3 py-2`
- 圖示：20px emoji 或 lucide-react icon

### Topbar

```tsx
// 白底，高度 64px，含頁面操作
<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
  {/* 左側：日期切換（DayView / WeekView 用） */}
  <div className="flex items-center gap-3">
    <button>←</button>
    <h1 className="text-lg font-semibold text-gray-900">3月10日 星期一</h1>
    <button>→</button>
    <button className="text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1">今天</button>
  </div>

  {/* 右側：主要 CTA */}
  <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
    + 新增時間塊
  </button>
</header>
```

### 時間塊卡片（BlockCard）

```
┌─────────────────────────────────┐
│ ▌ 晨跑  09:00–10:00             │
│   ✅ 習慣徽章                    │
└─────────────────────────────────┘
```

- 左側 3px 色條（習慣顏色）
- `rounded-lg shadow-sm`
- Hover：`shadow-md scale(1.01) transition`
- 背景：習慣色 `opacity-15`（淡色填充）+ 文字用習慣色（深色）

### Modal / Dialog

- 遮罩：`bg-black/40 backdrop-blur-sm`
- 卡片：`bg-white rounded-2xl shadow-xl p-6 w-96`
- 按鈕組：
  - 主要：`bg-indigo-600 text-white rounded-lg px-4 py-2`
  - 次要：`border border-gray-300 text-gray-700 rounded-lg px-4 py-2`

### 習慣 Sidebar（DayView 右側欄）

- 移除現有右側習慣欄，整合到獨立的 HabitsPage
- DayView 改為全寬時間軸，習慣透過 Topbar 的「+ 新增」按鈕操作

---

## 各頁面 Topbar 內容

| 頁面 | 左側 | 右側 |
|------|------|------|
| DayView | ← [日期] → [今天] | + 新增時間塊 |
| WeekView | ← [週範圍] → [本週] | — |
| MonthView | ← [月份] → [本月] | — |
| HabitsPage | 「習慣管理」標題 | + 新增習慣 |
| RoutinesPage | 「例行事項」標題 | + 新增例行 |
| TemplatesPage | 「範本」標題 | + 新增範本 |
| StatisticsPage | 「統計分析」標題 | 日期範圍選擇器 |

---

## 實作範圍

1. **新建 `AppLayout` 元件**：包含 Sidebar + 主內容區框架
2. **新建 `Sidebar` 元件**：導覽項目、Logo、使用者資訊
3. **新建 `Topbar` 元件**：接受 props 控制左右側內容
4. **更新 `App.tsx`**：所有受保護路由套用 AppLayout
5. **更新 `DayView`**：移除頂部 nav、移除習慣側邊欄、使用全寬 TimeAxis
6. **更新 `WeekView` / `MonthView`**：移除頂部 nav，接入 Topbar
7. **更新 `HabitsPage` / `RoutinesPage` / `TemplatesPage` / `StatisticsPage`**：移除頂部 nav
8. **更新 `BlockCard`**：新增左側色條、調整背景透明度
9. **更新 `LoginPage`**：升級登入頁視覺（居中卡片，indigo 主題）
10. **全面調整 Tailwind class**：套用新色彩與排版系統

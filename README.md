# TimeBlock 時間塊

個人時間塊（Time Blocking）網頁應用程式，結合習慣追蹤功能。

## 線上環境

| 服務 | URL |
|------|-----|
| 前端 | https://timeblock-alpha.vercel.app |
| 後端 API | https://timeblock-backend.onrender.com |
| API 文件 | https://timeblock-backend.onrender.com/docs |

> ⚠️ Render 免費方案閒置後會休眠，首次請求約需 50 秒喚醒。

## 技術棧

- **前端**: React 18 + Vite + TailwindCSS + shadcn/ui + Zustand
- **後端**: Python FastAPI + SQLAlchemy 2.0 + Alembic
- **資料庫**: PostgreSQL 16（Render 托管）
- **認證**: JWT + Google/GitHub OAuth2
- **部署**: Vercel（前端）+ Render（後端 + DB）

## 功能

- **時間塊排程**：日/週/月視圖，視覺化 24h 時間軸
- **色塊**：10 色預設調色盤，每個時間塊可選不同顏色
- **長按拖曳建立**：在時間軸上長按拖曳選取範圍，一次建立多小時時間塊
- **習慣拖入時間軸**：從側邊欄將習慣拖曳至時間軸，直接建立對應時間塊
- **專注計時器**：每個時間塊內建倒數計時器，完成後標記 completed_at
- **每日進度條**：即時顯示已排/已完成/空閒時數三色進度條
- **排程範本**：將今日排程另存為範本，套用至任意日期
- **習慣追蹤**：新增習慣、每日打卡、連續天數統計
- **使用者認證**：Email 註冊 / 登入、OAuth2 社群登入

## 本地啟動

### 前置需求

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+

### 1. 啟動資料庫

```bash
docker compose up -d db redis
```

### 2. 啟動後端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env
# 編輯 .env，設定 SECRET_KEY 與資料庫密碼
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. 啟動前端

```bash
cd frontend
npm install
cp .env.example .env.local
# 設定 VITE_API_URL=http://localhost:8000
npm run dev
```

API 文件：http://localhost:8000/docs

## 部署

### 後端（Render Blueprint）

```
Blueprint Path: backend/render.yaml
```

Render 會自動建立：
- PostgreSQL 資料庫（`timeblock-db`）
- Web Service（`timeblock-backend`）

部署後需在 Environment 設定：
```
FRONTEND_URL = https://你的vercel網址.vercel.app
```

### 前端（Vercel）

```
Root Directory: frontend
Framework: Vite
```

Environment Variables：
```
VITE_API_URL = https://timeblock-backend.onrender.com
```

## 測試

### 後端單元測試

```bash
cd backend
pytest --cov=app --cov-report=term-missing
```

### E2E 測試

```bash
cd frontend
npx playwright test
npx playwright show-report
```

E2E 覆蓋流程（26 個測試）：
- 頁面載入與路由保護
- 使用者註冊 / 登入
- 時間塊新增與視圖切換（含色塊選色）
- 習慣新增與打卡
- 並排佈局（習慣側邊欄 + 每日進度條）
- 範本頁面（標題、空狀態）

## 專案結構

```
timeblock/
├── backend/
│   ├── app/
│   │   ├── config.py       # Pydantic Settings 設定管理
│   │   ├── database.py     # 非同步 SQLAlchemy 引擎
│   │   ├── main.py         # FastAPI 應用程式入口
│   │   ├── models/         # ORM 資料模型
│   │   ├── schemas/        # Pydantic 請求/回應模型
│   │   ├── routers/        # API 路由（auth, blocks, habits）
│   │   └── services/       # 業務邏輯層
│   ├── alembic/            # 資料庫 migration
│   ├── tests/              # 單元測試
│   ├── render.yaml         # Render 部署設定
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # UI 元件（BlockCard, ColorPicker, DailyProgress, FocusTimer, HabitSidebar, TimeAxis...）
│   │   ├── pages/          # 頁面元件（DayView, WeekView, MonthView, HabitsPage, TemplatesPage）
│   │   ├── stores/         # Zustand 狀態管理
│   │   └── api/            # API 客戶端（blocks, habits, templates）
│   ├── e2e/                # Playwright E2E 測試（26 個）
│   └── vercel.json         # Vercel 部署設定
└── docker-compose.yml
```

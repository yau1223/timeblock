# TimeBlock 時間塊

個人時間塊（Time Blocking）網頁應用程式，結合習慣追蹤功能。

## 技術棧

- **前端**: React 18 + Vite + TailwindCSS + shadcn/ui + Zustand
- **後端**: Python FastAPI + SQLAlchemy 2.0 + Alembic
- **資料庫**: PostgreSQL 16
- **認證**: JWT + Google/GitHub OAuth2

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
source .venv/bin/activate
pip install -e ".[dev]"
cp ../.env.example ../.env
# 重要：請編輯 .env，修改 SECRET_KEY 為隨機長字串，並設定其他必要密碼
nano ../.env
uvicorn app.main:app --reload --port 8000
```

### 3. 啟動前端
```bash
cd frontend
npm install
npm run dev
```

API 文件：http://localhost:8000/docs

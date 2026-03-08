# TimeBlock 前端

React + TypeScript + Vite 前端應用程式。

## 技術棧

- React 18 + TypeScript
- Vite（建置工具）
- TailwindCSS + shadcn/ui（UI）
- Zustand（狀態管理）
- React Router v6（路由）

## 本地開發

```bash
npm install
cp .env.example .env.local
# 設定 VITE_API_URL=http://localhost:8000
npm run dev
```

## 環境變數

| 變數 | 說明 | 範例 |
|------|------|------|
| `VITE_API_URL` | 後端 API 網址 | `https://timeblock-backend.onrender.com` |

## 指令

```bash
npm run dev      # 開發模式
npm run build    # 生產建置
npm run preview  # 預覽生產建置
npm run lint     # ESLint 檢查
```

## E2E 測試

```bash
npx playwright install --with-deps  # 首次安裝
npx playwright test                  # 執行測試
npx playwright show-report           # 查看報告
```

測試檔案位於 `e2e/` 目錄，覆蓋認證、時間塊、習慣追蹤等核心流程。

## 部署（Vercel）

- Root Directory：`frontend`
- Framework：Vite（自動偵測）
- 環境變數：`VITE_API_URL`

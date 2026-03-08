# FastAPI 應用程式主入口，設定 CORS 與路由
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# 建立 FastAPI 應用程式實例
app = FastAPI(title="TimeBlock API", version="0.1.0")

# 設定 CORS 中介層，明確限制允許的來源、方法與標頭以降低 CSRF 風險
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# 健康檢查路由，供容器 orchestrator 或監控工具確認服務存活狀態
@app.get("/health")
async def health():
    """健康檢查端點，回傳服務狀態"""
    return {"status": "ok"}

# FastAPI 應用程式主入口，設定 CORS 與路由
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, blocks, habits, templates

# 建立 FastAPI 應用程式實例
app = FastAPI(title="TimeBlock API", version="0.1.0")


@app.on_event("startup")
async def validate_config():
    """啟動時驗證必要設定值，防止以不安全預設值運行於正式環境"""
    if settings.secret_key == "dev-secret-key-change-in-production":
        import os
        if os.getenv("ENVIRONMENT", "development").lower() == "production":
            raise RuntimeError("正式環境必須設定 SECRET_KEY 環境變數")

# 設定 CORS 中介層，明確限制允許的來源、方法與標頭以降低 CSRF 風險
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# 掛載認證路由
app.include_router(auth.router)
app.include_router(blocks.router)
app.include_router(habits.router)
app.include_router(templates.router)


# 健康檢查路由，供容器 orchestrator 或監控工具確認服務存活狀態
@app.get("/health")
async def health():
    """健康檢查端點，回傳服務狀態"""
    return {"status": "ok"}

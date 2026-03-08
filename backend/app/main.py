# FastAPI 應用程式主入口，設定 CORS 與路由
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# 建立 FastAPI 應用程式實例
app = FastAPI(title="TimeBlock API", version="0.1.0")

# 設定 CORS 中介層，允許前端跨域請求
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """健康檢查端點，供 load balancer 或監控工具使用"""
    return {"status": "ok"}

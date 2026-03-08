# 應用程式設定模組，從環境變數讀取所有設定值
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """應用程式設定，透過 Pydantic Settings 從環境變數自動載入"""
    # 資料庫連線字串（asyncpg 非同步驅動）
    database_url: str = "postgresql+asyncpg://timeblock:timeblock@localhost:5432/timeblock"
    # JWT 簽名密鑰（正式環境必須修改）
    secret_key: str = "dev-secret-key-change-in-production"
    # JWT 加密演算法
    algorithm: str = "HS256"
    # Token 有效期（分鐘），預設 7 天
    access_token_expire_minutes: int = 10080

    # Google OAuth 設定
    google_client_id: str = ""
    google_client_secret: str = ""
    # GitHub OAuth 設定
    github_client_id: str = ""
    github_client_secret: str = ""

    # 前端 URL（CORS 白名單）
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


# 全域設定物件，供其他模組引用
settings = Settings()

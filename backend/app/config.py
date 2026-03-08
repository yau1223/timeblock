# 應用程式設定模組，從環境變數讀取所有設定值
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """應用程式設定，透過 Pydantic Settings 從環境變數自動載入"""
    # 使用 Pydantic v2 的 model_config 取代舊版 inner Config class
    model_config = SettingsConfigDict(env_file=".env")

    # 資料庫連線字串（asyncpg 非同步驅動）
    # Render 提供的 DATABASE_URL 格式為 postgresql://，自動轉換為 postgresql+asyncpg://
    database_url: str = "postgresql+asyncpg://timeblock:timeblock@localhost:5432/timeblock"

    @property
    def async_database_url(self) -> str:
        """確保資料庫 URL 使用 asyncpg 驅動"""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url
    # JWT 簽名密鑰（正式環境必須透過環境變數設定，無預設值以強制安全）
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

    # 前端 URL（CORS 白名單），支援逗號分隔多個來源
    frontend_url: str = "http://localhost:5173"

    @property
    def allowed_origins(self) -> list[str]:
        """將逗號分隔的 frontend_url 解析為清單"""
        return [u.strip() for u in self.frontend_url.split(",") if u.strip()]


# 全域設定物件，供其他模組引用
settings = Settings()

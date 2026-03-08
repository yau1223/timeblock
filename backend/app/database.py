# 資料庫連線管理模組，提供非同步 SQLAlchemy 引擎與 Session
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


class Base(DeclarativeBase):
    """所有 ORM 模型的基底類別，供 Alembic 自動偵測資料表結構"""
    pass


# 建立非同步資料庫引擎（使用 asyncpg 驅動）
engine = create_async_engine(settings.database_url, echo=False)
# 建立非同步 Session 工廠
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依賴注入：提供資料庫 session，請求結束後自動關閉"""
    async with AsyncSessionLocal() as session:
        yield session

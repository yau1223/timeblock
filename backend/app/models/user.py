# 使用者帳號 ORM 模型
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    """使用者帳號資料表，支援本地帳號與 OAuth 社交登入"""
    __tablename__ = "users"

    # 主鍵，使用 UUID 避免自增 ID 的可預測性問題
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # 使用者 Email，唯一索引確保不重複
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    # 密碼雜湊值，OAuth 使用者為 null
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # 顯示名稱
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # 頭像 URL（來自 OAuth provider 或使用者上傳）
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # 認證方式：local（本地帳號）/ google / github
    auth_provider: Mapped[str] = mapped_column(String(20), default="local")
    # 建立時間，由資料庫自動填入
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 關聯關係（cascade 確保刪除使用者時一併刪除所有相關資料）
    time_blocks: Mapped[list["TimeBlock"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    habits: Mapped[list["Habit"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    categories: Mapped[list["Category"]] = relationship(back_populates="user", cascade="all, delete-orphan")

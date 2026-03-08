# 範本資料 ORM 模型
import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Template(Base):
    """範本資料模型：儲存使用者的排程範本，可重複套用至不同日期"""
    __tablename__ = "templates"

    # 主鍵，使用 UUID
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # 外鍵關聯至使用者，cascade 確保使用者刪除時範本一併刪除
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    # 範本名稱，最長 100 字元
    name: Mapped[str] = mapped_column(String(100))
    # 儲存時間塊陣列：[{title, color, offset_minutes, duration_minutes, habit_id?}]
    blocks: Mapped[list[Any]] = mapped_column(JSON, default=list)
    # 建立時間，使用 UTC 時間
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    # 關聯至使用者
    user = relationship("User", back_populates="templates")

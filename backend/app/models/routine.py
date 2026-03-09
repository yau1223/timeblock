# 例行事項 ORM 模型：固定時段重複事件，不追蹤完成率
import uuid
from datetime import time
from sqlalchemy import String, Boolean, Integer, Time, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Routine(Base):
    """例行事項：使用者的固定排程（吃飯、上班等），可設定自動生成時間塊"""
    __tablename__ = "routines"

    # 主鍵
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # 所屬使用者
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # 例行事項名稱（例：吃午飯、上班）
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    # 圖示識別碼（選填）
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # 顏色標示（hex）
    color: Mapped[str] = mapped_column(String(7), default="#f59e0b")
    # 開始時間（例：12:00）
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    # 時長（分鐘）
    duration: Mapped[int] = mapped_column(Integer, default=60)
    # 重複星期（JSON 陣列，0=週日，1-6=週一至週六；空陣列=每天）
    days_of_week: Mapped[list] = mapped_column(JSON, default=list)
    # True = 每日開啟 DayView 時自動生成對應時間塊
    auto_generate: Mapped[bool] = mapped_column(Boolean, default=False)
    # 軟刪除
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # 關聯至使用者
    user: Mapped["User"] = relationship(back_populates="routines")

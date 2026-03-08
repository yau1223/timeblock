# 時間塊 ORM 模型，代表使用者在時間軸上排定的時間段
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TimeBlock(Base):
    """時間塊：使用者在日曆上排定的具體時間段"""
    __tablename__ = "time_blocks"

    # 主鍵
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # 所屬使用者
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    # 時間塊標題（例如：深度工作、午休）
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    # 詳細說明（選填）
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # 顯示顏色（hex 格式）
    color: Mapped[str] = mapped_column(String(7), default="#6366f1")
    # 所屬分類（選填）
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    # 開始時間（含時區資訊）
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # 結束時間（含時區資訊）
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # 是否為重複性事件
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    # 重複規則（RRULE 格式，例如每週一重複）
    recur_rule: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # 若此塊由習慣自動產生，記錄來源習慣的 ID
    habit_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("habits.id"), nullable=True)

    # 所屬使用者關聯
    user: Mapped["User"] = relationship(back_populates="time_blocks")
    # 所屬分類關聯（可為空）
    category: Mapped["Category | None"] = relationship()

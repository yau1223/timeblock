# 習慣定義與每日完成記錄 ORM 模型
import uuid
from datetime import time
from datetime import date as date_type
from sqlalchemy import String, Boolean, Integer, Time, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Habit(Base):
    """使用者定義的習慣，可選擇性地自動排入每日時間軸"""
    __tablename__ = "habits"

    # 主鍵
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # 所屬使用者
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    # 習慣名稱（例如：晨跑、冥想）
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    # 圖示識別碼
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # 顏色標示
    color: Mapped[str] = mapped_column(String(7), default="#10b981")
    # 執行頻率：daily（每日）或 weekly（每週）
    frequency: Mapped[str] = mapped_column(String(10), default="daily")
    # 自動排入時間軸的預設時刻（例如 07:00）
    target_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    # 預計執行時長（分鐘）
    duration: Mapped[int] = mapped_column(Integer, default=30)
    # 是否啟用（軟刪除機制）
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # 所屬使用者關聯
    user: Mapped["User"] = relationship(back_populates="habits")
    # 每日完成記錄關聯
    logs: Mapped[list["HabitLog"]] = relationship(back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    """習慣每日完成記錄，用於計算連續天數（streak）"""
    __tablename__ = "habit_logs"
    # 確保同一個習慣每天只能有一筆記錄
    __table_args__ = (UniqueConstraint("habit_id", "date", name="uq_habit_log_habit_date"),)

    # 主鍵
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # 對應的習慣
    habit_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("habits.id"), nullable=False)
    # 所屬使用者（冗餘欄位，加速按使用者查詢）
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    # 記錄日期（使用 SQL Date 型別，確保資料庫層正確儲存）
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    # 是否已完成
    completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # 所屬習慣關聯
    habit: Mapped["Habit"] = relationship(back_populates="logs")

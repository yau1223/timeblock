# 時間塊分類標籤 ORM 模型
import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Category(Base):
    """使用者自訂的時間塊分類標籤，例如工作、學習、休息"""
    __tablename__ = "categories"

    # 主鍵
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # 所屬使用者（外鍵，刪除使用者時 cascade 至此）
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    # 分類名稱
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    # 顯示顏色（hex 格式，例如 #6366f1）
    color: Mapped[str] = mapped_column(String(7), default="#6366f1")
    # 圖示識別碼（對應前端圖示庫的 icon name）
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # 所屬使用者關聯
    user: Mapped["User"] = relationship(back_populates="categories")

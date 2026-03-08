# 時間塊 API 請求與回應的 Pydantic schema
from pydantic import BaseModel, field_validator
from datetime import datetime
import uuid


class TimeBlockCreate(BaseModel):
    """新增時間塊請求資料"""
    title: str
    description: str | None = None
    color: str = "#6366f1"
    category_id: uuid.UUID | None = None
    start_time: datetime
    end_time: datetime
    is_recurring: bool = False
    recur_rule: str | None = None

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v: datetime, info) -> datetime:
        """驗證結束時間必須晚於開始時間"""
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("結束時間必須晚於開始時間")
        return v


class TimeBlockUpdate(BaseModel):
    """更新時間塊請求資料（所有欄位皆可選）"""
    title: str | None = None
    description: str | None = None
    color: str | None = None
    category_id: uuid.UUID | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_recurring: bool | None = None
    recur_rule: str | None = None


class TimeBlockResponse(BaseModel):
    """時間塊回應資料"""
    id: uuid.UUID
    title: str
    description: str | None
    color: str
    category_id: uuid.UUID | None
    start_time: datetime
    end_time: datetime
    is_recurring: bool
    recur_rule: str | None
    habit_id: uuid.UUID | None
    # 完成時間（None 表示尚未完成）
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}

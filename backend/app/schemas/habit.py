# 習慣 API 請求與回應的 Pydantic schema
from pydantic import BaseModel
from datetime import time
import uuid


class HabitCreate(BaseModel):
    """新增習慣請求資料"""
    title: str
    icon: str | None = None
    color: str = "#10b981"
    frequency: str = "daily"
    target_time: time | None = None
    duration: int = 30


class HabitUpdate(BaseModel):
    """更新習慣請求資料（所有欄位可選）"""
    title: str | None = None
    icon: str | None = None
    color: str | None = None
    frequency: str | None = None
    target_time: time | None = None
    duration: int | None = None
    is_active: bool | None = None


class HabitResponse(BaseModel):
    """習慣回應資料（含後端計算的 streak 連續天數）"""
    id: uuid.UUID
    title: str
    icon: str | None
    color: str
    frequency: str
    target_time: time | None
    duration: int
    is_active: bool
    streak: int = 0  # 後端計算後附加，不存於資料庫

    model_config = {"from_attributes": True}


class HabitLogResponse(BaseModel):
    """習慣每日記錄回應資料"""
    date: str
    completed: bool

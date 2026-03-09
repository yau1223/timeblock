# 例行事項 API 請求與回應 Pydantic schema
from pydantic import BaseModel
from datetime import time
import uuid


class RoutineCreate(BaseModel):
    """新增例行事項請求資料"""
    title: str
    icon: str | None = None
    color: str = "#f59e0b"
    start_time: time
    duration: int = 60
    days_of_week: list[int] = []
    auto_generate: bool = False


class RoutineUpdate(BaseModel):
    """更新例行事項請求資料（所有欄位可選）"""
    title: str | None = None
    icon: str | None = None
    color: str | None = None
    start_time: time | None = None
    duration: int | None = None
    days_of_week: list[int] | None = None
    auto_generate: bool | None = None


class RoutineResponse(BaseModel):
    """例行事項回應資料"""
    id: uuid.UUID
    title: str
    icon: str | None
    color: str
    start_time: time
    duration: int
    days_of_week: list[int]
    auto_generate: bool
    is_active: bool

    model_config = {"from_attributes": True}

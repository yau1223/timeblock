# 例行事項 API 請求與回應 Pydantic schema
from typing import Annotated
from pydantic import BaseModel, Field
from datetime import time
import uuid

# 星期值型別：限制元素範圍在 0（週日）到 6（週六）
WeekDay = Annotated[int, Field(ge=0, le=6)]


class RoutineCreate(BaseModel):
    """新增例行事項請求資料"""
    # 名稱最長 100 字元
    title: str = Field(..., max_length=100)
    icon: str | None = None
    # 顏色必須為合法 hex 格式（#RRGGBB）
    color: str = Field("#f59e0b", pattern=r"^#[0-9a-fA-F]{6}$")
    start_time: time
    # 時長（分鐘），必須為正整數
    duration: int = Field(60, gt=0)
    # 重複星期，每個元素限制 0-6
    days_of_week: list[WeekDay] = []
    auto_generate: bool = False


class RoutineUpdate(BaseModel):
    """更新例行事項請求資料（所有欄位可選）"""
    # 名稱最長 100 字元
    title: str | None = Field(None, max_length=100)
    icon: str | None = None
    # 顏色必須為合法 hex 格式（#RRGGBB），可不更新
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    start_time: time | None = None
    # 時長（分鐘），必須為正整數，可不更新
    duration: int | None = Field(None, gt=0)
    # 重複星期，每個元素限制 0-6，可不更新
    days_of_week: list[WeekDay] | None = None
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

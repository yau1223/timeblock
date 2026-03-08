# 範本相關 Pydantic schemas
from datetime import datetime
from typing import Any
import uuid
from pydantic import BaseModel


class TemplateBlockItem(BaseModel):
    """範本內的單一時間塊資料"""
    # 時間塊標題
    title: str
    # 顯示顏色（十六進位色碼）
    color: str
    # 從當日 00:00 起的分鐘偏移（例如 540 = 早上 9 點）
    offset_minutes: int
    # 持續時間（分鐘）
    duration_minutes: int
    # 關聯的習慣 ID（選填）
    habit_id: str | None = None


class TemplateCreate(BaseModel):
    """建立範本請求 schema"""
    # 範本名稱
    name: str
    # 時間塊列表
    blocks: list[TemplateBlockItem]


class TemplateResponse(BaseModel):
    """範本回應 schema"""
    # 範本 UUID
    id: uuid.UUID
    # 範本名稱
    name: str
    # 時間塊資料（原始 JSON）
    blocks: list[Any]
    # 建立時間
    created_at: datetime
    model_config = {"from_attributes": True}

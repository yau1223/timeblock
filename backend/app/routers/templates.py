# 範本 CRUD API 路由
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateResponse

# 路由前綴統一為 /api/templates
router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("/", response_model=list[TemplateResponse])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得目前使用者的所有範本，依建立時間排序"""
    result = await db.execute(
        select(Template).where(Template.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    body: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """建立新範本，blocks 為時間塊陣列"""
    # 將 Pydantic model 轉換為 dict 儲存至 JSON 欄位
    t = Template(
        user_id=current_user.id,
        name=body.name,
        blocks=[b.model_dump() for b in body.blocks]
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """刪除指定範本，僅能刪除自己的範本"""
    # 查詢指定範本，同時確認屬於當前使用者（防止越權存取）
    result = await db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.user_id == current_user.id
        )
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="範本不存在"
        )
    await db.delete(t)
    await db.commit()

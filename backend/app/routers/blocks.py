# 時間塊 CRUD 路由：支援依日期或範圍查詢、新增、更新、刪除
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.timeblock import TimeBlock
from app.schemas.block import TimeBlockCreate, TimeBlockUpdate, TimeBlockResponse

router = APIRouter(prefix="/api/blocks", tags=["blocks"])


@router.get("/", response_model=list[TimeBlockResponse])
async def list_blocks(
    date: str | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得使用者的時間塊列表；可依日期（date）或時間範圍（start/end）篩選"""
    query = select(TimeBlock).where(TimeBlock.user_id == current_user.id)

    if date:
        # 取得指定日期全天（00:00:00 ~ 23:59:59 UTC）的時間塊
        day_start = datetime.fromisoformat(f"{date}T00:00:00+00:00")
        day_end = datetime.fromisoformat(f"{date}T23:59:59+00:00")
        query = query.where(
            and_(TimeBlock.start_time >= day_start, TimeBlock.start_time <= day_end)
        )
    elif start and end:
        # 取得指定範圍內的時間塊（用於週/月視圖）
        query = query.where(
            and_(TimeBlock.start_time >= start, TimeBlock.start_time <= end)
        )

    query = query.order_by(TimeBlock.start_time)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TimeBlockResponse, status_code=status.HTTP_201_CREATED)
async def create_block(
    body: TimeBlockCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """新增時間塊，自動關聯至目前使用者"""
    block = TimeBlock(**body.model_dump(), user_id=current_user.id)
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return block


@router.patch("/{block_id}", response_model=TimeBlockResponse)
async def update_block(
    block_id: uuid.UUID,
    body: TimeBlockUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新指定時間塊（僅更新提供的欄位），包含拖曳後的時間調整"""
    result = await db.execute(
        select(TimeBlock).where(
            TimeBlock.id == block_id,
            TimeBlock.user_id == current_user.id,
        )
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="時間塊不存在")

    # 僅更新請求中明確提供的欄位（exclude_unset=True 過濾未提供欄位）
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(block, field, value)

    await db.commit()
    await db.refresh(block)
    return block


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(
    block_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """刪除指定時間塊（僅能刪除自己的）"""
    result = await db.execute(
        select(TimeBlock).where(
            TimeBlock.id == block_id,
            TimeBlock.user_id == current_user.id,
        )
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="時間塊不存在")

    await db.delete(block)
    await db.commit()

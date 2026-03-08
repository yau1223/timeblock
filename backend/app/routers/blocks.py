# 時間塊 CRUD 路由：支援依日期或範圍查詢、新增、更新、刪除
import uuid
from datetime import datetime, timezone, date as date_type
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
    date: date_type | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得使用者的時間塊列表；可依日期（date）或時間範圍（start/end）篩選"""
    query = select(TimeBlock).where(TimeBlock.user_id == current_user.id)

    if date:
        # 取得指定日期全天（00:00:00 ~ 23:59:59 UTC）的時間塊
        day_start = datetime(date.year, date.month, date.day, 0, 0, 0, tzinfo=timezone.utc)
        day_end = datetime(date.year, date.month, date.day, 23, 59, 59, tzinfo=timezone.utc)
        # 使用重疊區間條件，確保跨日時間塊也能正確顯示
        query = query.where(
            and_(TimeBlock.start_time <= day_end, TimeBlock.end_time >= day_start)
        )
    elif start and end:
        # 重疊區間查詢：start_time 在範圍內，或完全包覆查詢範圍
        query = query.where(
            and_(TimeBlock.start_time <= end, TimeBlock.end_time >= start)
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

    # 驗證更新後的時間順序（考慮部分更新情境）
    final_start = body.start_time if body.start_time is not None else block.start_time
    final_end = body.end_time if body.end_time is not None else block.end_time
    if final_end <= final_start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="結束時間必須晚於開始時間",
        )

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

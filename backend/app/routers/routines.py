# 例行事項路由：CRUD、手動套用到日期、自動生成今日時間塊
import uuid
from datetime import date, datetime, time, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.routine import Routine
from app.models.timeblock import TimeBlock
from app.schemas.routine import RoutineCreate, RoutineUpdate, RoutineResponse

router = APIRouter(prefix="/api/routines", tags=["routines"])


def _routine_to_block(routine: Routine, user_id: uuid.UUID, target_date: date) -> TimeBlock:
    """將例行事項轉換為指定日期的 TimeBlock 物件（不含 DB 操作）"""
    # 計算結束時間（處理跨小時）
    total_minutes = routine.start_time.hour * 60 + routine.start_time.minute + routine.duration
    end_hour = (total_minutes // 60) % 24
    end_minute = total_minutes % 60
    start_dt = datetime.combine(target_date, routine.start_time, tzinfo=timezone.utc)
    end_dt = datetime.combine(target_date, time(end_hour, end_minute), tzinfo=timezone.utc)
    return TimeBlock(
        user_id=user_id,
        title=routine.title,
        color=routine.color,
        start_time=start_dt,
        end_time=end_dt,
        source_type="routine",
        habit_id=None,
    )


@router.get("/auto-generate")
async def auto_generate(
    target_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """自動為 auto_generate=True 的例行事項生成當日時間塊（冪等）"""
    # 取出所有 auto_generate 的例行事項
    result = await db.execute(
        select(Routine).where(
            Routine.user_id == current_user.id,
            Routine.is_active == True,  # noqa: E712
            Routine.auto_generate == True,  # noqa: E712
        )
    )
    routines = result.scalars().all()

    # 取出當日已存在的 routine 時間塊標題集合
    day_start = datetime.combine(target_date, time(0, 0), tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, time(23, 59, 59), tzinfo=timezone.utc)
    existing_result = await db.execute(
        select(TimeBlock.title).where(
            and_(
                TimeBlock.user_id == current_user.id,
                TimeBlock.source_type == "routine",
                TimeBlock.start_time >= day_start,
                TimeBlock.start_time <= day_end,
            )
        )
    )
    existing_titles = {row[0] for row in existing_result.all()}

    # 判斷今日是否為例行事項的重複星期（0=週日 ...6=週六）
    # Python isoweekday: 1=Mon, 7=Sun → 轉成 0=Sun, 1=Mon...6=Sat
    weekday = target_date.isoweekday() % 7
    generated = 0
    for routine in routines:
        days = routine.days_of_week or []
        if days and weekday not in days:
            continue  # 今日不在重複星期內
        if routine.title in existing_titles:
            continue  # 已存在，跳過
        block = _routine_to_block(routine, current_user.id, target_date)
        db.add(block)
        generated += 1

    if generated:
        await db.commit()

    return {"generated": generated, "skipped": len(routines) - generated}


@router.get("/", response_model=list[RoutineResponse])
async def list_routines(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得使用者所有啟用中的例行事項"""
    result = await db.execute(
        select(Routine).where(
            Routine.user_id == current_user.id,
            Routine.is_active == True,  # noqa: E712
        )
    )
    return result.scalars().all()


@router.post("/", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def create_routine(
    body: RoutineCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """新增例行事項"""
    routine = Routine(user_id=current_user.id, **body.model_dump())
    db.add(routine)
    await db.commit()
    await db.refresh(routine)
    return routine


@router.patch("/{routine_id}", response_model=RoutineResponse)
async def update_routine(
    routine_id: uuid.UUID,
    body: RoutineUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新例行事項（部分更新）"""
    result = await db.execute(
        select(Routine).where(
            Routine.id == routine_id,
            Routine.user_id == current_user.id,
        )
    )
    routine = result.scalar_one_or_none()
    if not routine:
        raise HTTPException(status_code=404, detail="例行事項不存在")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(routine, field, value)

    await db.commit()
    await db.refresh(routine)
    return routine


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_routine(
    routine_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """軟刪除例行事項（is_active = False）"""
    result = await db.execute(
        select(Routine).where(
            Routine.id == routine_id,
            Routine.user_id == current_user.id,
        )
    )
    routine = result.scalar_one_or_none()
    if not routine:
        raise HTTPException(status_code=404, detail="例行事項不存在")

    routine.is_active = False
    await db.commit()


@router.post("/{routine_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_routine(
    routine_id: uuid.UUID,
    target_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """手動將指定例行事項套用到特定日期，生成 TimeBlock（不重複建立）"""
    result = await db.execute(
        select(Routine).where(
            Routine.id == routine_id,
            Routine.user_id == current_user.id,
            Routine.is_active == True,  # noqa: E712
        )
    )
    routine = result.scalar_one_or_none()
    if not routine:
        raise HTTPException(status_code=404, detail="例行事項不存在")

    # 冪等保護：檢查當日是否已存在
    day_start = datetime.combine(target_date, time(0, 0), tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, time(23, 59, 59), tzinfo=timezone.utc)
    existing = await db.execute(
        select(TimeBlock).where(
            and_(
                TimeBlock.user_id == current_user.id,
                TimeBlock.source_type == "routine",
                TimeBlock.title == routine.title,
                TimeBlock.start_time >= day_start,
                TimeBlock.start_time <= day_end,
            )
        )
    )
    if existing.scalar_one_or_none():
        return {"created": False, "message": "當日已存在此例行事項時間塊"}

    block = _routine_to_block(routine, current_user.id, target_date)
    db.add(block)
    await db.commit()
    return {"created": True}

# 習慣管理路由：CRUD、每日打勾切換、連續天數計算
import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.habit import Habit, HabitLog
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse, HabitLogResponse

router = APIRouter(prefix="/api/habits", tags=["habits"])

# streak 計算安全上限，防止無限迴圈
MAX_STREAK_DAYS = 3650


async def _calc_streak(db: AsyncSession, habit_id: uuid.UUID, user_id: uuid.UUID) -> int:
    """從今天往前計算習慣的連續完成天數（streak），遇到未完成日即停止"""
    streak = 0
    check_date = date.today()
    while streak < MAX_STREAK_DAYS:
        result = await db.execute(
            select(HabitLog).where(
                and_(
                    HabitLog.habit_id == habit_id,
                    HabitLog.user_id == user_id,
                    HabitLog.date == check_date,
                    HabitLog.completed == True,  # noqa: E712
                )
            )
        )
        if not result.scalar_one_or_none():
            break
        streak += 1
        check_date -= timedelta(days=1)
    return streak


@router.get("/", response_model=list[HabitResponse])
async def list_habits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得使用者所有啟用中的習慣列表（含 streak 連續天數）"""
    result = await db.execute(
        select(Habit).where(
            Habit.user_id == current_user.id,
            Habit.is_active == True,  # noqa: E712
        )
    )
    habits = result.scalars().all()

    # 計算每個習慣的 streak 並附加至回應
    responses = []
    for habit in habits:
        streak = await _calc_streak(db, habit.id, current_user.id)
        data = HabitResponse.model_validate(habit)
        data.streak = streak
        responses.append(data)
    return responses


@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    body: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """新增習慣，自動關聯至目前使用者"""
    habit = Habit(**body.model_dump(), user_id=current_user.id)
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    response = HabitResponse.model_validate(habit)
    response.streak = 0
    return response


@router.patch("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: uuid.UUID,
    body: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新指定習慣（僅更新提供的欄位）"""
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="習慣不存在")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(habit, field, value)

    await db.commit()
    await db.refresh(habit)
    streak = await _calc_streak(db, habit.id, current_user.id)
    response = HabitResponse.model_validate(habit)
    response.streak = streak
    return response


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """軟刪除習慣（設為 is_active=False，保留歷史記錄）"""
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="習慣不存在")

    # 軟刪除：保留歷史 log，僅標記為非啟用
    habit.is_active = False
    await db.commit()


@router.post("/{habit_id}/logs/{log_date}", response_model=HabitLogResponse)
async def toggle_habit_log(
    habit_id: uuid.UUID,
    log_date: date,  # FastAPI 自動驗證 YYYY-MM-DD 格式
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """切換指定日期的習慣完成狀態（打勾/取消）；記錄不存在時自動建立"""
    # 確認習慣屬於目前使用者
    habit_result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    if not habit_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="習慣不存在")

    # 查詢現有記錄
    result = await db.execute(
        select(HabitLog).where(
            and_(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == current_user.id,
                HabitLog.date == log_date,
            )
        )
    )
    log = result.scalar_one_or_none()

    if log:
        # 切換完成狀態
        log.completed = not log.completed
    else:
        # 首次打勾，建立新記錄
        log = HabitLog(
            habit_id=habit_id,
            user_id=current_user.id,
            date=log_date,
            completed=True,
        )
        db.add(log)

    await db.commit()
    await db.refresh(log)
    return HabitLogResponse(date=log_date.isoformat(), completed=log.completed)


@router.get("/{habit_id}/streak", response_model=int)
async def get_streak(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得指定習慣的目前連續完成天數"""
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="習慣不存在")
    return await _calc_streak(db, habit_id, current_user.id)

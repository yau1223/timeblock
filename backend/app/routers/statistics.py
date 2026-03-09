# 統計查詢路由：時間分配、習慣完成率、習慣全年熱力圖
import uuid
from datetime import date, datetime, timedelta, timezone, time
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.timeblock import TimeBlock
from app.models.habit import Habit, HabitLog
from app.models.category import Category

router = APIRouter(prefix="/api/statistics", tags=["statistics"])


def _date_range(range_type: str, base_date: date) -> tuple[date, date]:
    """依 range 類型計算開始與結束日期（含頭含尾）

    Args:
        range_type: 範圍類型，可為 day / week / month
        base_date: 基準日期

    Returns:
        (start_date, end_date) 的 tuple
    """
    if range_type == "day":
        return base_date, base_date
    if range_type == "week":
        # weekday() 回傳 0=Monday ... 6=Sunday，計算當週起始日（週一）
        start = base_date - timedelta(days=base_date.weekday())
        return start, start + timedelta(days=6)
    # month：計算當月第一天與最後一天
    start = base_date.replace(day=1)
    if base_date.month == 12:
        end = date(base_date.year + 1, 1, 1) - timedelta(days=1)
    else:
        end = date(base_date.year, base_date.month + 1, 1) - timedelta(days=1)
    return start, end


@router.get("/time-distribution")
async def time_distribution(
    range: str = Query("week", pattern="^(day|week|month)$"),
    date: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """查詢指定範圍內各分類的時間分配（分鐘數）

    按分類聚合時間塊總時長，無分類的時間塊歸入「未分類」，
    結果依時間長短由多到少排序。

    Args:
        range: 查詢範圍（day / week / month）
        date: 基準日期
        current_user: 已驗證的使用者
        db: 非同步資料庫 Session

    Returns:
        list of {"category": str, "minutes": int}
    """
    start, end = _date_range(range, date)
    # 將日期邊界轉換為 UTC aware datetime 以匹配資料庫欄位型別
    # 使用半開區間 [start_dt, end_dt)，避免 23:59:59 之後的微秒資料遺漏
    start_dt = datetime.combine(start, time(0, 0), tzinfo=timezone.utc)
    end_dt = datetime.combine(end + timedelta(days=1), time(0, 0), tzinfo=timezone.utc)

    result = await db.execute(
        select(TimeBlock).where(
            and_(
                TimeBlock.user_id == current_user.id,
                TimeBlock.start_time >= start_dt,
                TimeBlock.end_time < end_dt,
            )
        )
    )
    blocks = result.scalars().all()

    # 蒐集所有有效的 category_id，批次查詢避免 N+1 問題
    cat_ids = {b.category_id for b in blocks if b.category_id}
    categories: dict[uuid.UUID, str] = {}
    if cat_ids:
        cat_result = await db.execute(
            select(Category).where(Category.id.in_(cat_ids))
        )
        categories = {c.id: c.name for c in cat_result.scalars().all()}

    # 聚合：按 category label 分組累加時間（分鐘）
    totals: dict[str, int] = {}
    for block in blocks:
        duration = int((block.end_time - block.start_time).total_seconds() / 60)
        # 無分類或查不到分類名稱時，統一標示為「未分類」
        label = categories.get(block.category_id, "未分類") if block.category_id else "未分類"
        totals[label] = totals.get(label, 0) + duration

    # 依時間長短由多到少排序後回傳
    return [{"category": k, "minutes": v} for k, v in sorted(totals.items(), key=lambda x: -x[1])]


@router.get("/habits/completion")
async def habits_completion(
    range: str = Query("week", pattern="^(day|week|month)$"),
    date: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """查詢指定範圍內各習慣的完成率

    只統計 is_active=True 的習慣，完成率以百分比（0-100）表示。

    Args:
        range: 查詢範圍（day / week / month）
        date: 基準日期
        current_user: 已驗證的使用者
        db: 非同步資料庫 Session

    Returns:
        list of {"habit_id", "title", "color", "completed", "total", "rate"}
    """
    start, end = _date_range(range, date)
    # 計算範圍內的總天數（作為完成率分母）
    total_days = (end - start).days + 1

    # 取得所有啟用中的習慣
    habits_result = await db.execute(
        select(Habit).where(
            Habit.user_id == current_user.id,
            Habit.is_active == True,  # noqa: E712
        )
    )
    habits = habits_result.scalars().all()
    if not habits:
        return []

    # 批次查詢範圍內所有已完成的習慣記錄
    logs_result = await db.execute(
        select(HabitLog).where(
            and_(
                HabitLog.user_id == current_user.id,
                HabitLog.date >= start,
                HabitLog.date <= end,
                HabitLog.completed == True,  # noqa: E712
            )
        )
    )
    logs = logs_result.scalars().all()

    # 按 habit_id 聚合完成次數
    completed_count: dict[uuid.UUID, int] = {}
    for log in logs:
        completed_count[log.habit_id] = completed_count.get(log.habit_id, 0) + 1

    return [
        {
            "habit_id": str(h.id),
            "title": h.title,
            "color": h.color,
            "completed": completed_count.get(h.id, 0),
            "total": total_days,
            "rate": round(completed_count.get(h.id, 0) / total_days * 100, 1),
        }
        for h in habits
    ]


@router.get("/habits/heatmap")
async def habits_heatmap(
    habit_id: uuid.UUID,
    year: int = Query(default_factory=lambda: date.today().year),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """查詢指定習慣全年每日完成狀態（用於熱力圖）

    若 habit_id 不存在或無記錄，回傳空字典。
    使用者隔離：只回傳屬於目前使用者的記錄。

    Args:
        habit_id: 習慣的 UUID
        year: 查詢年份
        current_user: 已驗證的使用者
        db: 非同步資料庫 Session

    Returns:
        dict，鍵為日期字串（YYYY-MM-DD），值為完成布林值
    """
    start = date(year, 1, 1)
    end = date(year, 12, 31)

    result = await db.execute(
        select(HabitLog).where(
            and_(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == current_user.id,
                HabitLog.date >= start,
                HabitLog.date <= end,
            )
        )
    )
    logs = result.scalars().all()
    # 將日期格式化為字串作為 JSON key，符合前端熱力圖資料格式
    return {str(log.date): log.completed for log in logs}

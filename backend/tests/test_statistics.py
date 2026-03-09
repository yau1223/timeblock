# 統計 API 測試
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_time_distribution_empty(client: AsyncClient, auth_headers: dict):
    """無時間塊時，時間分配回傳空陣列"""
    res = await client.get(
        "/api/statistics/time-distribution",
        params={"range": "day", "date": "2026-03-09"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_time_distribution_week_range(client: AsyncClient, auth_headers: dict):
    """range=week 應回傳 200"""
    res = await client.get(
        "/api/statistics/time-distribution",
        params={"range": "week", "date": "2026-03-09"},
        headers=auth_headers,
    )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_time_distribution_month_range(client: AsyncClient, auth_headers: dict):
    """range=month 應回傳 200"""
    res = await client.get(
        "/api/statistics/time-distribution",
        params={"range": "month", "date": "2026-03-09"},
        headers=auth_headers,
    )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_habit_completion_empty(client: AsyncClient, auth_headers: dict):
    """無習慣時，習慣完成率回傳空陣列"""
    res = await client.get(
        "/api/statistics/habits/completion",
        params={"range": "week", "date": "2026-03-09"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_habit_heatmap_invalid_habit(client: AsyncClient, auth_headers: dict):
    """不存在的 habit_id 應回傳空字典（非 404）"""
    import uuid
    res = await client.get(
        "/api/statistics/habits/heatmap",
        params={"habit_id": str(uuid.uuid4()), "year": 2026},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json() == {}

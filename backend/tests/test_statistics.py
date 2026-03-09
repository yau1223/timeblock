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


@pytest.mark.asyncio
async def test_time_distribution_with_blocks(client: AsyncClient, auth_headers: dict):
    """有時間塊時，時間分配應回傳正確分鐘數"""
    # 建立一個 2026-03-09 09:00-11:00 的時間塊（120 分鐘）
    res = await client.post("/api/blocks/", json={
        "title": "深度工作",
        "color": "#6366f1",
        "start_time": "2026-03-09T09:00:00Z",
        "end_time": "2026-03-09T11:00:00Z",
    }, headers=auth_headers)
    assert res.status_code == 201

    dist_res = await client.get(
        "/api/statistics/time-distribution",
        params={"range": "day", "date": "2026-03-09"},
        headers=auth_headers,
    )
    assert dist_res.status_code == 200
    data = dist_res.json()
    assert len(data) > 0
    # 未分類時間塊應計入「未分類」
    item = next((d for d in data if d["category"] == "未分類"), None)
    assert item is not None
    assert item["minutes"] == 120


@pytest.mark.asyncio
async def test_habit_completion_with_data(client: AsyncClient, auth_headers: dict):
    """有習慣完成記錄時，完成率應正確計算"""
    # 新增習慣
    habit_res = await client.post("/api/habits/", json={
        "title": "晨跑", "color": "#10b981", "duration": 30,
    }, headers=auth_headers)
    assert habit_res.status_code == 201
    habit_id = habit_res.json()["id"]

    # 打勾今日完成
    toggle_res = await client.post(
        f"/api/habits/{habit_id}/logs/2026-03-09",
        headers=auth_headers,
    )
    assert toggle_res.status_code in (200, 201)

    # 查詢當日完成率
    comp_res = await client.get(
        "/api/statistics/habits/completion",
        params={"range": "day", "date": "2026-03-09"},
        headers=auth_headers,
    )
    assert comp_res.status_code == 200
    data = comp_res.json()
    assert len(data) > 0
    habit_stat = next((d for d in data if d["habit_id"] == habit_id), None)
    assert habit_stat is not None
    assert habit_stat["completed"] == 1
    assert habit_stat["rate"] == 100.0


@pytest.mark.asyncio
async def test_habit_heatmap_with_data(client: AsyncClient, auth_headers: dict):
    """有完成記錄時，熱力圖應回傳正確日期對應"""
    # 新增習慣
    habit_res = await client.post("/api/habits/", json={
        "title": "冥想", "color": "#8b5cf6", "duration": 20,
    }, headers=auth_headers)
    assert habit_res.status_code == 201
    habit_id = habit_res.json()["id"]

    # 打勾完成
    toggle_res = await client.post(
        f"/api/habits/{habit_id}/logs/2026-03-09",
        headers=auth_headers,
    )
    assert toggle_res.status_code in (200, 201)

    # 查詢熱力圖
    heatmap_res = await client.get(
        "/api/statistics/habits/heatmap",
        params={"habit_id": habit_id, "year": 2026},
        headers=auth_headers,
    )
    assert heatmap_res.status_code == 200
    heatmap = heatmap_res.json()
    assert "2026-03-09" in heatmap
    assert heatmap["2026-03-09"] is True

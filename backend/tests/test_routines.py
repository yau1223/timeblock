# 例行事項 CRUD + auto-generate API 測試
import pytest
from httpx import AsyncClient


ROUTINE_PAYLOAD = {
    "title": "吃午飯",
    "color": "#f59e0b",
    "start_time": "12:00:00",
    "duration": 60,
    "days_of_week": [1, 2, 3, 4, 5],
    "auto_generate": False,
}


@pytest.mark.asyncio
async def test_list_routines_empty(client: AsyncClient, auth_headers: dict):
    """未建立任何例行事項時，應回傳空陣列"""
    res = await client.get("/api/routines/", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_create_routine(client: AsyncClient, auth_headers: dict):
    """新增例行事項應回傳 201 與完整資料"""
    res = await client.post("/api/routines/", json=ROUTINE_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "吃午飯"
    assert data["duration"] == 60
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_update_routine(client: AsyncClient, auth_headers: dict):
    """更新例行事項標題"""
    create_res = await client.post("/api/routines/", json=ROUTINE_PAYLOAD, headers=auth_headers)
    routine_id = create_res.json()["id"]

    res = await client.patch(
        f"/api/routines/{routine_id}",
        json={"title": "吃晚飯"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["title"] == "吃晚飯"


@pytest.mark.asyncio
async def test_delete_routine(client: AsyncClient, auth_headers: dict):
    """刪除例行事項後，列表不再出現"""
    create_res = await client.post("/api/routines/", json=ROUTINE_PAYLOAD, headers=auth_headers)
    routine_id = create_res.json()["id"]

    del_res = await client.delete(f"/api/routines/{routine_id}", headers=auth_headers)
    assert del_res.status_code == 204

    list_res = await client.get("/api/routines/", headers=auth_headers)
    assert list_res.json() == []


@pytest.mark.asyncio
async def test_auto_generate_creates_blocks(client: AsyncClient, auth_headers: dict):
    """auto_generate=True 的例行事項應在指定日期生成時間塊"""
    payload = {**ROUTINE_PAYLOAD, "auto_generate": True, "days_of_week": []}
    await client.post("/api/routines/", json=payload, headers=auth_headers)

    res = await client.get(
        "/api/routines/auto-generate",
        params={"target_date": "2026-03-09"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["generated"] == 1


@pytest.mark.asyncio
async def test_auto_generate_idempotent(client: AsyncClient, auth_headers: dict):
    """重複呼叫 auto-generate 不應產生重複時間塊"""
    payload = {**ROUTINE_PAYLOAD, "auto_generate": True, "days_of_week": []}
    await client.post("/api/routines/", json=payload, headers=auth_headers)

    await client.get("/api/routines/auto-generate", params={"target_date": "2026-03-10"}, headers=auth_headers)
    res2 = await client.get("/api/routines/auto-generate", params={"target_date": "2026-03-10"}, headers=auth_headers)
    assert res2.json()["generated"] == 0


@pytest.mark.asyncio
async def test_apply_routine_creates_block(client: AsyncClient, auth_headers: dict):
    """手動套用例行事項應建立時間塊，回傳 201"""
    create_res = await client.post("/api/routines/", json=ROUTINE_PAYLOAD, headers=auth_headers)
    routine_id = create_res.json()["id"]

    res = await client.post(
        f"/api/routines/{routine_id}/apply",
        params={"target_date": "2026-03-09"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["created"] is True


@pytest.mark.asyncio
async def test_apply_routine_idempotent(client: AsyncClient, auth_headers: dict):
    """重複套用同一例行事項到同一天應跳過（冪等），回傳 200"""
    create_res = await client.post("/api/routines/", json=ROUTINE_PAYLOAD, headers=auth_headers)
    routine_id = create_res.json()["id"]

    await client.post(f"/api/routines/{routine_id}/apply", params={"target_date": "2026-03-11"}, headers=auth_headers)
    res2 = await client.post(f"/api/routines/{routine_id}/apply", params={"target_date": "2026-03-11"}, headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["created"] is False

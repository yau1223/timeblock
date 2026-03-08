# 範本 CRUD API 測試
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_template(client: AsyncClient, auth_headers: dict):
    """測試建立並列出範本"""
    # 建立範本
    res = await client.post("/api/templates/", json={
        "name": "工作日",
        "blocks": [{"title": "晨會", "color": "#6366f1", "offset_minutes": 540, "duration_minutes": 60}]
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "工作日"
    assert len(data["blocks"]) == 1
    assert data["blocks"][0]["title"] == "晨會"

    # 列出範本應回傳 1 筆
    list_res = await client.get("/api/templates/", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


@pytest.mark.asyncio
async def test_delete_template(client: AsyncClient, auth_headers: dict):
    """測試刪除範本，刪除後列表應為空"""
    # 先建立範本
    create_res = await client.post("/api/templates/", json={
        "name": "測試範本", "blocks": []
    }, headers=auth_headers)
    assert create_res.status_code == 201
    template_id = create_res.json()["id"]

    # 刪除範本
    del_res = await client.delete(f"/api/templates/{template_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # 列表應為空
    list_res = await client.get("/api/templates/", headers=auth_headers)
    assert len(list_res.json()) == 0


@pytest.mark.asyncio
async def test_delete_nonexistent_template(client: AsyncClient, auth_headers: dict):
    """刪除不存在的範本應回傳 404"""
    fake_id = "00000000-0000-0000-0000-000000000099"
    res = await client.delete(f"/api/templates/{fake_id}", headers=auth_headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_templates_require_auth(client: AsyncClient):
    """未認證存取範本 API 應回傳 401"""
    res = await client.get("/api/templates/")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_template_blocks_with_habit_id(client: AsyncClient, auth_headers: dict):
    """範本時間塊可選填 habit_id"""
    res = await client.post("/api/templates/", json={
        "name": "含習慣範本",
        "blocks": [
            {"title": "晨跑", "color": "#10b981", "offset_minutes": 360, "duration_minutes": 30, "habit_id": "some-habit-id"},
            {"title": "工作", "color": "#6366f1", "offset_minutes": 540, "duration_minutes": 120}
        ]
    }, headers=auth_headers)
    assert res.status_code == 201
    blocks = res.json()["blocks"]
    assert len(blocks) == 2
    assert blocks[0]["habit_id"] == "some-habit-id"
    assert blocks[1]["habit_id"] is None
